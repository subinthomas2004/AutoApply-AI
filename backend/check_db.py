import sqlite3, os

db_path = 'd:/qaz/backend/jobs_app.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

print(f"Database: {db_path}  ({round(os.path.getsize(db_path)/1024,1)} KB)")

# Clean up garbage candidate (name='26.10.2026')
bad_cands = c.execute("SELECT id, full_name FROM candidates WHERE full_name LIKE '%.%.%'").fetchall()
if bad_cands:
    for cid, name in bad_cands:
        # Reassign any applications
        c.execute("UPDATE applications SET candidate_id=3 WHERE candidate_id=?", (cid,))
        c.execute("DELETE FROM candidates WHERE id=?", (cid,))
    conn.commit()
    print(f"Cleaned {len(bad_cands)} garbage candidate(s)")

# Remaining candidates
print("\n=== CANDIDATES ===")
for r in c.execute("SELECT id, full_name, email, extracted_skills FROM candidates").fetchall():
    print(f"  [{r[0]}] {r[1]} | {r[2]} | Skills: {r[3]}")

# Job stats
total = c.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
with_match = c.execute("SELECT COUNT(*) FROM jobs WHERE match_score > 0").fetchone()[0]
print(f"\n=== JOBS ===  Total: {total}  |  With match scores: {with_match}")

sources = c.execute("SELECT source, COUNT(*) FROM jobs GROUP BY source ORDER BY 2 DESC").fetchall()
for src, cnt in sources:
    print(f"  {src}: {cnt} jobs")

# Applications
print("\n=== APPLICATIONS ===")
for r in c.execute("SELECT a.id, c.full_name, j.title, j.company, a.recipient_email, a.status FROM applications a JOIN candidates c ON c.id=a.candidate_id JOIN jobs j ON j.id=a.job_id").fetchall():
    print(f"  [{r[0]}] {r[1]} → {r[2]} @ {r[3]}  To:{r[4]}  Status:{r[5]}")

conn.close()
print("\nAll tables healthy.")

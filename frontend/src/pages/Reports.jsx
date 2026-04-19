import { useEffect, useState } from "react";

export default function Reports() {
  const [forums, setForums] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr("");
      const [a, b] = await Promise.all([
        fetch("/api/reports/forum-summary", { credentials: "include" }),
        fetch("/api/reports/ratings-by-semester", { credentials: "include" }),
      ]);
      if (cancelled) return;
      if (!a.ok || !b.ok) {
        const j = await (a.ok ? b : a).json().catch(() => ({}));
        setErr(j.error ? String(j.error) : "Could not load reports.");
        setForums([]);
        setSemesters([]);
        return;
      }
      setForums(await a.json());
      setSemesters(await b.json());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="home-body reports-page">
      <h1>Reports</h1>
      <p className="muted">
        Aggregated forum activity and ratings. Scores are stored on a 1–10 scale; the “out of 5” column is half of that value.
      </p>
      {err ? (
        <p className="alert alert--error" role="alert">
          {err}
        </p>
      ) : null}

      <section className="report-section">
        <h2>Forums summary</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Title</th>
                <th>Instructor</th>
                <th>Ratings</th>
                <th>Avg (1–10)</th>
                <th>Avg /5</th>
                <th>Posts</th>
              </tr>
            </thead>
            <tbody>
              {forums.map((r) => (
                <tr key={r.forumId}>
                  <td>{r.courseCode}</td>
                  <td>{r.courseTitle}</td>
                  <td>{r.instructorName}</td>
                  <td>{r.ratingCount}</td>
                  <td>
                    {r.avgScoreOneToTen != null
                      ? Number(r.avgScoreOneToTen).toFixed(2)
                      : "—"}
                  </td>
                  <td>
                    {r.avgOutOfFive != null
                      ? Number(r.avgOutOfFive).toFixed(2)
                      : "—"}
                  </td>
                  <td>{r.postCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="report-section">
        <h2>Ratings by semester</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Semester</th>
                <th>Rating count</th>
                <th>Avg (1–10)</th>
                <th>Avg /5</th>
              </tr>
            </thead>
            <tbody>
              {semesters.map((r) => (
                <tr key={r.semesterLabel}>
                  <td>{r.semesterLabel}</td>
                  <td>{r.ratingCount}</td>
                  <td>{Number(r.avgScoreOneToTen).toFixed(2)}</td>
                  <td>{Number(r.avgOutOfFive).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

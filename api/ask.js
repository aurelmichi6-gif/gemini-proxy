export default async 
  function handler(req, res) {
  const q = req.query.q || "hello";

  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + process.env.GEMINI_KEY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: q }] }]
    })
  });

  const d = await r.json();

  const text = d?.candidates?.[0]?.content?.parts?.[0]?.text || "err";

  res.status(200).send(text);
}

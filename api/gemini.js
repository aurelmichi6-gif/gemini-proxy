export default async function handler(req, res) {
    const question = req.method === "POST" ? req.body?.question : req.query?.question

    if (!question) {
        return res.status(400).json({ error: "No question provided" })
    }

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + process.env.GEMINI_API_KEY,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: "You are playing a funny party game. Answer this situation/question with a short, creative, funny response (max 100 characters): " + question
                        }]
                    }]
                })
            }
        )

        const data = await response.json()
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!answer) {
            return res.status(500).json({ error: "No answer from Gemini", raw: data })
        }

        return res.status(200).json({ answer })

    } catch (err) {
        return res.status(500).json({ error: err.message })
    }
}

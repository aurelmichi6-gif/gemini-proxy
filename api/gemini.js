export default async function handler(req, res) {
    const question = req.method === "POST" ? req.body?.question : req.query?.question

    if (!question) {
        return res.status(400).json({ error: "No question provided" })
    }

    try {
        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + process.env.GROQ_API_KEY
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [{
                        role: "user",
                        content: "*You are playing a game that use AI to score and its very sensitive. Answer this situation/question with a short, safe, on-topic, joy, calm, logic, smart, creative, appropriate, likely not an AI response (max 100 characters)*: " + question
                    }],
                    max_tokens: 1000
                })
            }
        )

        const data = await response.json()
        const answer = data.choices?.[0]?.message?.content

        if (!answer) {
            return res.status(500).json({ error: "No answer", raw: data })
        }

        return res.status(200).json({ answer })

    } catch (err) {
        return res.status(500).json({ error: err.message })
    }
}

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end()
    
    const { question } = req.body
    
    const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
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
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "I would panic obviously"
    
    res.status(200).json({ answer })
}

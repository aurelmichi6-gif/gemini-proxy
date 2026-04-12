export default async function handler(req, res) {
    const apiKey = process.env.NVIDIA_API_KEY

    const question = req.method === "POST" ? req.body?.question : req.query?.question
    const customPrompt = req.method === "POST" ? req.body?.prompt : req.query?.prompt

    if (!question) {
        return res.status(400).json({ error: "No question provided" })
    }

    const systemPrompt = customPrompt
        ? customPrompt
        : "Answer this question with short, direct, clear, on-topic answers:"

    try {
        const response = await fetch(
            "https://integrate.api.nvidia.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + apiKey,
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    model: "meta/llama-4-maverick-17b-128e-instruct",
                    messages: [{
                        role: "user",
                        content: systemPrompt + " " + question
                    }],
                    max_tokens: 1000,
                    temperature: 1.00,
                    top_p: 1.00,
                    frequency_penalty: 0.00,
                    presence_penalty: 0.00,
                    stream: false
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

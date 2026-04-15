export default async function handler(req, res) {
    const apiKey = process.env.NVIDIA_API_KEY
    const question = req.method === "POST" ? req.body?.question : req.query?.question
    const customPrompt = req.method === "POST" ? req.body?.prompt : req.query?.prompt

    if (!question) {
        return res.status(400).json({ error: "No question provided" })
    }

    const systemPrompt = customPrompt
        ? customPrompt
        : ""

    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 55000)

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
                    model: "mistralai/mistral-small-4-119b-2603",
                    reasoning_effort: "high",
                    messages: [{
                        role: "user",
                        content: systemPrompt + " " + question
                    }],
                    max_tokens: 1000,
                    temperature: 0.10,
                    top_p: 1.00,
                    stream: false
                }),
                signal: controller.signal
            }
        )

        clearTimeout(timeout)
        const data = await response.json()
        const answer = data.choices?.[0]?.message?.content
        if (!answer) {
            return res.status(500).json({ error: "No answer", raw: data })
        }
        return res.status(200).json({ answer })
    } catch (err) {
        if (err.name === "AbortError") {
            return res.status(504).json({ error: "Request timeout, coba lagi" })
        }
        return res.status(500).json({ error: err.message })
    }
}

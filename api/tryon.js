const FASHN_BASE = 'https://api.fashn.ai/v1';

// Dùng FASHN AI (Try-On Max) qua REST API trực tiếp — bất đồng bộ với polling,
// vì model AI thử đồ thường mất vài chục giây, dễ vượt timeout của serverless function.
export default async function handler(req, res) {
    if (!process.env.FASHN_API_KEY) {
        return res.status(500).json({ error: { message: 'FASHN_API_KEY chưa được cấu hình trên server' } });
    }
    const authHeader = { 'Authorization': `Bearer ${process.env.FASHN_API_KEY}` };

    try {
        if (req.method === 'POST') {
            const { humanImage, garmentImageUrl } = req.body || {};
            if (!humanImage || !garmentImageUrl) {
                return res.status(400).json({ error: { message: 'Thiếu ảnh khách hàng hoặc ảnh sản phẩm' } });
            }

            const response = await fetch(FASHN_BASE + '/run', {
                method: 'POST',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_name: 'tryon-max',
                    inputs: {
                        model_image: humanImage,
                        product_image: garmentImageUrl,
                        resolution: '1k'
                    }
                })
            });
            const data = await response.json();
            if (!response.ok || data.error) {
                return res.status(response.ok ? 400 : response.status).json({
                    error: { message: data.error || 'Không gửi được yêu cầu tới FASHN AI.' }
                });
            }
            return res.status(200).json({ requestId: data.id });
        }

        if (req.method === 'GET') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: { message: 'Thiếu request id' } });

            const response = await fetch(`${FASHN_BASE}/status/${id}`, { headers: authHeader });
            const data = await response.json();
            if (!response.ok) {
                return res.status(response.status).json({ error: { message: data.error || 'Không kiểm tra được trạng thái xử lý.' } });
            }
            if (data.error) {
                return res.status(400).json({ error: { message: data.error } });
            }

            // Chuẩn hóa response về 1 định dạng chung cho frontend
            const STATUS_MAP = {
                starting: 'IN_QUEUE',
                in_queue: 'IN_QUEUE',
                processing: 'IN_PROGRESS',
                completed: 'COMPLETED',
                failed: 'FAILED'
            };
            const normalized = { status: STATUS_MAP[data.status] || data.status };
            if (data.status === 'completed' && Array.isArray(data.output) && data.output[0]) {
                normalized.image = { url: data.output[0] };
            }
            return res.status(200).json(normalized);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        res.status(500).json({ error: { message: 'Internal server error: ' + err.message } });
    }
}

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod === 'POST') {
        try {
            const { email, name } = JSON.parse(event.body);
            
            if (!email || !name) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Email and name are required' })
                };
            }

            console.log(`🎁 Free trial started for: ${email}`);
            
            // For trial, you could send an email here
            // For now, just return success
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Free trial activated! Check your email for download instructions.' 
                })
            };
        } catch (error) {
            console.error('Trial signup error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to start trial' })
            };
        }
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
};

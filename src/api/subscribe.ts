import type { VercelRequest, VercelResponse } from '@vercel/node';
import mailchimp from '@mailchimp/mailchimp_marketing';

mailchimp.setConfig({
  apiKey: '2cb9e235a37981f6e0933e6ca75595c7-us3',
  server: 'us3',
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { email } = request.body;

  if (!email) {
    return response.status(400).json({ error: 'Email is required' });
  }

  try {
    await mailchimp.lists.addListMember('bc5287777f', {
      email_address: email,
      status: 'subscribed',
    });

    return response.status(200).json({ message: 'Successfully subscribed' });
  } catch (error) {
    return response.status(500).json({ error: (error as any).message || 'Something went wrong' });
  }
}

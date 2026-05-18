import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card } from '@arco-design/web-react';

export default function Login() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = (values: { email: string; password: string }) => {
    // No actual auth logic needed - demo purposes only
    console.log('Login:', values);
    navigate('/dashboard');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0A14',
      }}
    >
      <Card
        style={{
          width: 400,
          background: '#111827',
          border: '1px solid #1E293B',
        }}
        bodyStyle={{ background: '#111827' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #06B6D4, #22D3EE)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 22,
              color: '#0A0A14',
              marginBottom: 12,
            }}
          >
            R
          </div>
          <h1 style={{ color: '#E2E8F0', fontSize: 22, fontWeight: 700 }}>
            RemoteWeb3 Admin
          </h1>
          <p style={{ color: '#94A3B8', fontSize: 14, marginTop: 4 }}>
            Sign in to your admin panel
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSubmit}
          style={{ width: '100%' }}
        >
          <Form.Item
            field="email"
            label={<span style={{ color: '#E2E8F0' }}>Email</span>}
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              placeholder="admin@remoteweb3.com"
              style={{
                background: '#0A0A14',
                borderColor: '#1E293B',
                color: '#E2E8F0',
              }}
            />
          </Form.Item>

          <Form.Item
            field="password"
            label={<span style={{ color: '#E2E8F0' }}>Password</span>}
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              placeholder="Enter your password"
              style={{
                background: '#0A0A14',
                borderColor: '#1E293B',
                color: '#E2E8F0',
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              long
              style={{
                height: 40,
                fontSize: 15,
                background: '#06B6D4',
                border: 'none',
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

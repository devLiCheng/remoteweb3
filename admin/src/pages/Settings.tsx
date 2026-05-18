import { useState } from 'react';
import { Tabs, Form, Input, Button, Card, Typography, Message } from '@arco-design/web-react';
import axios from 'axios';

const { Title, Text } = Typography;
const { TextArea } = Input;
const TabPane = Tabs.TabPane;

export default function Settings() {
  const [generalForm] = Form.useForm();
  const [seoForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [dbStatus] = useState<string>('Connected');

  const handleSaveGeneral = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      await axios.put('/api/admin/settings/general', values);
      Message.success('General settings saved');
    } catch {
      Message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSeo = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      await axios.put('/api/admin/settings/seo', values);
      Message.success('SEO settings saved');
    } catch {
      Message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInitDb = async () => {
    try {
      await axios.post('/api/admin/database/initialize');
      Message.success('Database initialized successfully');
    } catch {
      Message.error('Failed to initialize database');
    }
  };

  const handleBackup = async () => {
    try {
      await axios.post('/api/admin/database/backup');
      Message.success('Backup created successfully');
    } catch {
      Message.error('Failed to create backup');
    }
  };

  return (
    <div>
      <Title heading={4} style={{ color: '#E2E8F0', marginBottom: 20 }}>
        Settings
      </Title>

      <Card
        style={{ background: '#111827', border: '1px solid #1E293B' }}
        bodyStyle={{ background: '#111827' }}
      >
        <Tabs
          defaultActiveTab="general"
          style={{ color: '#E2E8F0' }}
        >
          <TabPane key="general" title="General">
            <div style={{ maxWidth: 600, padding: '16px 0' }}>
              <Form
                form={generalForm}
                layout="vertical"
                onSubmit={handleSaveGeneral}
                labelCol={{ style: { color: '#E2E8F0' } }}
              >
                <Form.Item
                  field="site_name"
                  label="Site Name"
                  rules={[{ required: true, message: 'Please enter site name' }]}
                >
                  <Input placeholder="RemoteWeb3" />
                </Form.Item>

                <Form.Item field="site_description" label="Site Description">
                  <TextArea
                    placeholder="Brief description of the site..."
                    rows={3}
                    style={{ background: '#0A0A14', borderColor: '#1E293B', color: '#E2E8F0' }}
                  />
                </Form.Item>

                <Form.Item field="contact_email" label="Contact Email">
                  <Input placeholder="admin@remoteweb3.com" />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={saving}
                    style={{ background: '#06B6D4', border: 'none' }}
                  >
                    Save General Settings
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </TabPane>

          <TabPane key="seo" title="SEO">
            <div style={{ maxWidth: 600, padding: '16px 0' }}>
              <Form
                form={seoForm}
                layout="vertical"
                onSubmit={handleSaveSeo}
                labelCol={{ style: { color: '#E2E8F0' } }}
              >
                <Form.Item field="meta_title" label="Default Meta Title">
                  <Input placeholder="RemoteWeb3 - Web3 Job Board" />
                </Form.Item>

                <Form.Item field="meta_description" label="Meta Description">
                  <TextArea
                    placeholder="SEO description for search engines..."
                    rows={3}
                    style={{ background: '#0A0A14', borderColor: '#1E293B', color: '#E2E8F0' }}
                  />
                </Form.Item>

                <Form.Item field="meta_keywords" label="Meta Keywords">
                  <Input placeholder="web3, blockchain, crypto jobs, remote" />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={saving}
                    style={{ background: '#06B6D4', border: 'none' }}
                  >
                    Save SEO Settings
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </TabPane>

          <TabPane key="database" title="Database">
            <div style={{ maxWidth: 600, padding: '16px 0' }}>
              <Card
                style={{
                  background: 'rgba(30,41,59,0.4)',
                  border: '1px solid #1E293B',
                  marginBottom: 16,
                }}
                bodyStyle={{ background: 'transparent' }}
              >
                <div style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 13 }}>Database Status</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#10B981',
                      display: 'inline-block',
                    }}
                  />
                  <Text style={{ color: '#10B981', fontSize: 15, fontWeight: 600 }}>
                    {dbStatus}
                  </Text>
                </div>
              </Card>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <Button
                  style={{
                    background: '#06B6D4',
                    border: 'none',
                    color: '#0A0A14',
                    fontWeight: 600,
                  }}
                  onClick={handleInitDb}
                >
                  Initialize Database
                </Button>
                <Button
                  style={{
                    borderColor: '#06B6D4',
                    color: '#06B6D4',
                  }}
                  onClick={handleBackup}
                >
                  Backup
                </Button>
              </div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 6,
                  background: 'rgba(234,179,8,0.1)',
                  border: '1px solid rgba(234,179,8,0.3)',
                }}
              >
                <Text style={{ color: '#EAB308', fontSize: 13 }}>
                  Warning: Initializing the database will reset all data. Make sure you have a backup before proceeding.
                </Text>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Select, Button, Card, Switch, Spin, Message,
  Typography, InputNumber,
} from '@arco-design/web-react';
import axios from 'axios';

const { Title } = Typography;
const { TextArea } = Input;

export default function CompanyEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const fetchCompany = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/companies/${id}`);
        const company = res.data.data ?? res.data;
        form.setFieldsValue({
          name: company.name,
          website: company.website,
          description: company.description,
          industry: company.industry,
          company_size: company.company_size,
          headquarters: company.headquarters,
          founded_year: company.founded_year,
          logo_url: company.logo_url,
          is_verified: company.is_verified ?? false,
        });
      } catch {
        Message.error('Failed to load company data');
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id, isEdit, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await axios.put(`/api/admin/companies/${id}`, values);
        Message.success('Company updated successfully');
      } else {
        await axios.post('/api/admin/companies', values);
        Message.success('Company created successfully');
      }
      navigate('/companies');
    } catch {
      Message.error('Failed to save company');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Title heading={4} style={{ color: '#E2E8F0', marginBottom: 20 }}>
        {isEdit ? 'Edit Company' : 'Create Company'}
      </Title>

      <Card
        style={{ background: '#111827', border: '1px solid #1E293B', maxWidth: 800 }}
        bodyStyle={{ background: '#111827' }}
      >
        <Spin loading={loading} style={{ width: '100%' }}>
          <Form
            form={form}
            layout="vertical"
            onSubmit={handleSubmit}
            labelCol={{ style: { color: '#E2E8F0' } }}
          >
            <Form.Item
              field="name"
              label="Company Name"
              rules={[{ required: true, message: 'Please enter company name' }]}
            >
              <Input placeholder="e.g. Uniswap Labs" />
            </Form.Item>

            <Form.Item field="website" label="Website">
              <Input placeholder="https://example.com" />
            </Form.Item>

            <Form.Item field="description" label="Description">
              <TextArea
                placeholder="Company description..."
                rows={3}
                style={{ background: '#0A0A14', borderColor: '#1E293B', color: '#E2E8F0' }}
              />
            </Form.Item>

            <Form.Item field="industry" label="Industry">
              <Input placeholder="e.g. DeFi, Blockchain Infrastructure" />
            </Form.Item>

            <Form.Item field="company_size" label="Company Size">
              <Select
                placeholder="Select company size"
                options={[
                  { label: '1-10', value: '1-10' },
                  { label: '11-50', value: '11-50' },
                  { label: '51-200', value: '51-200' },
                  { label: '201-500', value: '201-500' },
                  { label: '501-1000', value: '501-1000' },
                  { label: '1000+', value: '1000+' },
                ]}
              />
            </Form.Item>

            <Form.Item field="headquarters" label="Headquarters">
              <Input placeholder="e.g. New York, USA" />
            </Form.Item>

            <Form.Item field="founded_year" label="Founded Year">
              <InputNumber placeholder="e.g. 2020" min={1900} max={2100} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item field="logo_url" label="Logo URL">
              <Input placeholder="https://example.com/logo.png" />
            </Form.Item>

            <Form.Item field="is_verified" label="Verified" triggerPropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item>
              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  style={{ background: '#06B6D4', border: 'none' }}
                >
                  {isEdit ? 'Update Company' : 'Create Company'}
                </Button>
                <Button
                  onClick={() => navigate('/companies')}
                  style={{ color: '#94A3B8' }}
                >
                  Cancel
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}

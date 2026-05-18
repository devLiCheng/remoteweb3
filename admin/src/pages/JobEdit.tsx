import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Select, Button, Card, Switch, Spin, Message,
  Typography, InputNumber,
} from '@arco-design/web-react';
import axios from 'axios';

const { Title } = Typography;
const { TextArea } = Input;

interface Company {
  id: number;
  name: string;
}

interface Tag {
  id: number;
  name: string;
}

export default function JobEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [compRes, tagRes] = await Promise.all([
          axios.get('/api/companies'),
          axios.get('/api/tags'),
        ]);
        setCompanies(compRes.data.data ?? compRes.data.companies ?? compRes.data ?? []);
        setTags(tagRes.data.data ?? tagRes.data.tags ?? tagRes.data ?? []);
      } catch { /* ignore */ }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const fetchJob = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/jobs/${id}`);
        const job = res.data.data ?? res.data;
        form.setFieldsValue({
          title: job.title,
          company_id: job.company_id,
          location: job.location,
          is_remote: job.is_remote ?? false,
          job_type: job.job_type,
          experience_level: job.experience_level,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          description: job.description,
          requirements: job.requirements,
          tags: job.tags ?? job.tag_ids ?? [],
          is_active: job.is_active ?? true,
        });
      } catch {
        Message.error('Failed to load job data');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id, isEdit, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await axios.put(`/api/admin/jobs/${id}`, values);
        Message.success('Job updated successfully');
      } else {
        await axios.post('/api/admin/jobs', values);
        Message.success('Job created successfully');
      }
      navigate('/jobs');
    } catch {
      Message.error('Failed to save job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Title heading={4} style={{ color: '#E2E8F0', marginBottom: 20 }}>
        {isEdit ? 'Edit Job' : 'Create Job'}
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
              field="title"
              label="Job Title"
              rules={[{ required: true, message: 'Please enter job title' }]}
            >
              <Input placeholder="e.g. Senior Solidity Developer" />
            </Form.Item>

            <Form.Item
              field="company_id"
              label="Company"
              rules={[{ required: true, message: 'Please select a company' }]}
            >
              <Select
                placeholder="Select company"
                showSearch
                filterOption={(inputValue, option) =>
                  (option.props.children as string)
                    ?.toLowerCase()
                    .includes(inputValue.toLowerCase())
                }
                options={companies.map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
              />
            </Form.Item>

            <Form.Item field="location" label="Location">
              <Input placeholder="e.g. Remote, New York, London" />
            </Form.Item>

            <Form.Item field="is_remote" label="Remote" triggerPropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item
              field="job_type"
              label="Job Type"
              rules={[{ required: true, message: 'Please select job type' }]}
            >
              <Select
                placeholder="Select job type"
                options={[
                  { label: 'Full-time', value: 'full-time' },
                  { label: 'Part-time', value: 'part-time' },
                  { label: 'Contract', value: 'contract' },
                  { label: 'Internship', value: 'internship' },
                  { label: 'Freelance', value: 'freelance' },
                ]}
              />
            </Form.Item>

            <Form.Item
              field="experience_level"
              label="Experience Level"
              rules={[{ required: true, message: 'Please select experience level' }]}
            >
              <Select
                placeholder="Select level"
                options={[
                  { label: 'Entry', value: 'entry' },
                  { label: 'Mid', value: 'mid' },
                  { label: 'Senior', value: 'senior' },
                  { label: 'Lead', value: 'lead' },
                  { label: 'Executive', value: 'executive' },
                ]}
              />
            </Form.Item>

            <Form.Item label="Salary Range">
              <div style={{ display: 'flex', gap: 12 }}>
                <Form.Item field="salary_min" noStyle>
                  <InputNumber placeholder="Min" min={0} style={{ width: '100%' }} />
                </Form.Item>
                <span style={{ color: '#94A3B8', lineHeight: '32px' }}>-</span>
                <Form.Item field="salary_max" noStyle>
                  <InputNumber placeholder="Max" min={0} style={{ width: '100%' }} />
                </Form.Item>
              </div>
            </Form.Item>

            <Form.Item field="description" label="Description">
              <TextArea
                placeholder="Job description..."
                rows={4}
                style={{ background: '#0A0A14', borderColor: '#1E293B', color: '#E2E8F0' }}
              />
            </Form.Item>

            <Form.Item field="requirements" label="Requirements">
              <TextArea
                placeholder="Job requirements..."
                rows={4}
                style={{ background: '#0A0A14', borderColor: '#1E293B', color: '#E2E8F0' }}
              />
            </Form.Item>

            <Form.Item field="tags" label="Tags">
              <Select
                mode="multiple"
                placeholder="Select tags"
                options={tags.map((t) => ({
                  label: t.name,
                  value: t.id,
                }))}
              />
            </Form.Item>

            <Form.Item field="is_active" label="Active" triggerPropName="checked">
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
                  {isEdit ? 'Update Job' : 'Create Job'}
                </Button>
                <Button
                  onClick={() => navigate('/jobs')}
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

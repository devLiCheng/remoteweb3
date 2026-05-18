import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Space, Popconfirm, Message,
  Typography, Card, Modal, Form, Select,
} from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import axios from 'axios';

const { Title } = Typography;

interface Tag {
  id: number;
  name: string;
  type: string;
  job_count: number;
}

export default function TagManagement() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tags');
      setTags(res.data.data ?? res.data.tags ?? res.data ?? []);
    } catch {
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleAdd = async (values: { name: string; type: string }) => {
    setSubmitting(true);
    try {
      await axios.post('/api/admin/tags', values);
      Message.success('Tag created successfully');
      setModalVisible(false);
      form.resetFields();
      fetchTags();
    } catch {
      Message.error('Failed to create tag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/admin/tags/${id}`);
      Message.success('Tag deleted successfully');
      fetchTags();
    } catch {
      Message.error('Failed to delete tag');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Name', dataIndex: 'name', width: 200 },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 150,
      render: (v: string) => (
        <span style={{ textTransform: 'capitalize', color: '#94A3B8' }}>{v ?? '-'}</span>
      ),
    },
    {
      title: 'Job Count',
      dataIndex: 'job_count',
      width: 100,
      render: (v: number) => (
        <span style={{ color: '#06B6D4', fontWeight: 600 }}>{v ?? 0}</span>
      ),
    },
    {
      title: 'Actions',
      dataIndex: 'id',
      width: 100,
      fixed: 'right' as const,
      render: (id: number) => (
        <Popconfirm
          title="Delete this tag?"
          content="It will be removed from all jobs."
          onOk={() => handleDelete(id)}
        >
          <Button type="text" size="small" status="danger">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Title heading={4} style={{ color: '#E2E8F0', margin: 0 }}>
          Tag Management
        </Title>
        <Button
          type="primary"
          icon={<IconPlus />}
          style={{ background: '#06B6D4', border: 'none' }}
          onClick={() => setModalVisible(true)}
        >
          Add Tag
        </Button>
      </div>

      <Card
        style={{ background: '#111827', border: '1px solid #1E293B' }}
        bodyStyle={{ background: '#111827' }}
      >
        <Table
          columns={columns}
          data={tags}
          loading={loading}
          stripe
          border={false}
          rowKey="id"
          pagination={{ style: { color: '#94A3B8' } }}
        />
      </Card>

      <Modal
        title={<span style={{ color: '#E2E8F0' }}>Add Tag</span>}
        visible={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        footer={null}
        style={{ background: '#111827', border: '1px solid #1E293B' }}
      >
        <Form
          form={form}
          layout="vertical"
          onSubmit={handleAdd}
          labelCol={{ style: { color: '#E2E8F0' } }}
          style={{ padding: '16px 0' }}
        >
          <Form.Item
            field="name"
            label="Tag Name"
            rules={[{ required: true, message: 'Please enter tag name' }]}
          >
            <Input placeholder="e.g. Solidity" />
          </Form.Item>

          <Form.Item
            field="type"
            label="Tag Type"
            rules={[{ required: true, message: 'Please select tag type' }]}
          >
            <Select
              placeholder="Select type"
              options={[
                { label: 'Skill', value: 'skill' },
                { label: 'Technology', value: 'technology' },
                { label: 'Category', value: 'category' },
                { label: 'Role', value: 'role' },
                { label: 'Blockchain', value: 'blockchain' },
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              style={{ background: '#06B6D4', border: 'none' }}
            >
              Create Tag
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

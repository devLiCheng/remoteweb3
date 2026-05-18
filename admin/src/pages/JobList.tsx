import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Input, Space, Select, Modal, Message,
  Typography, Popconfirm, Card,
} from '@arco-design/web-react';
import { IconPlus, IconSearch } from '@arco-design/web-react/icon';
import axios from 'axios';

const { Title } = Typography;

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  job_type: string;
  experience_level: string;
  salary: string;
  posted_date: string;
  is_active: boolean;
}

export default function JobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [levelFilter, setLevelFilter] = useState<string | undefined>();
  const [remoteFilter, setRemoteFilter] = useState<string | undefined>();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: pageSize };
      if (search) params.search = search;
      if (typeFilter) params.job_type = typeFilter;
      if (levelFilter) params.experience_level = levelFilter;
      if (remoteFilter) params.is_remote = remoteFilter;

      const res = await axios.get('/api/jobs', { params });
      setJobs(res.data.data ?? res.data.jobs ?? res.data ?? []);
      setTotal(res.data.total ?? res.data.count ?? 0);
    } catch {
      setJobs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, typeFilter, levelFilter, remoteFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/admin/jobs/${id}`);
      Message.success('Job deleted successfully');
      fetchJobs();
    } catch {
      Message.error('Failed to delete job');
    }
  };

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Title', dataIndex: 'title', width: 180 },
    { title: 'Company', dataIndex: 'company', width: 150 },
    { title: 'Location', dataIndex: 'location', width: 140 },
    {
      title: 'Type',
      dataIndex: 'job_type',
      width: 110,
      render: (v: string) => (
        <span style={{ textTransform: 'capitalize', color: '#94A3B8' }}>
          {v?.replace('_', '-') ?? '-'}
        </span>
      ),
    },
    {
      title: 'Level',
      dataIndex: 'experience_level',
      width: 100,
      render: (v: string) => (
        <span style={{ textTransform: 'capitalize', color: '#94A3B8' }}>{v ?? '-'}</span>
      ),
    },
    { title: 'Salary', dataIndex: 'salary', width: 130 },
    { title: 'Posted Date', dataIndex: 'posted_date', width: 120 },
    {
      title: 'Status',
      dataIndex: 'is_active',
      width: 100,
      render: (active: boolean) => (
        <span
          style={{
            padding: '2px 10px',
            borderRadius: 4,
            fontSize: 12,
            background: active ? 'rgba(6,182,212,0.15)' : 'rgba(148,163,184,0.15)',
            color: active ? '#06B6D4' : '#94A3B8',
          }}
        >
          {active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      dataIndex: 'id',
      width: 150,
      fixed: 'right' as const,
      render: (id: number) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            style={{ color: '#06B6D4' }}
            onClick={() => navigate(`/jobs/${id}/edit`)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this job?"
            content="This action cannot be undone."
            onOk={() => handleDelete(id)}
          >
            <Button type="text" size="small" status="danger">
              Delete
            </Button>
          </Popconfirm>
        </Space>
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
          Job Management
        </Title>
        <Button
          type="primary"
          icon={<IconPlus />}
          style={{ background: '#06B6D4', border: 'none' }}
          onClick={() => navigate('/jobs/new')}
        >
          Add Job
        </Button>
      </div>

      <Card
        style={{ background: '#111827', border: '1px solid #1E293B', marginBottom: 16 }}
        bodyStyle={{ background: '#111827' }}
      >
        <Space wrap size="medium">
          <Input.Search
            placeholder="Search jobs..."
            allowClear
            searchButton
            onSearch={handleSearch}
            onChange={(v) => { if (!v) setSearch(''); }}
            style={{
              width: 280,
              background: '#0A0A14',
              borderColor: '#1E293B',
            }}
          />
          <Select
            placeholder="Job Type"
            allowClear
            value={typeFilter}
            onChange={(v) => { setTypeFilter(v); setPage(1); }}
            style={{ width: 150 }}
            options={[
              { label: 'Full-time', value: 'full-time' },
              { label: 'Part-time', value: 'part-time' },
              { label: 'Contract', value: 'contract' },
              { label: 'Internship', value: 'internship' },
              { label: 'Freelance', value: 'freelance' },
            ]}
          />
          <Select
            placeholder="Experience Level"
            allowClear
            value={levelFilter}
            onChange={(v) => { setLevelFilter(v); setPage(1); }}
            style={{ width: 150 }}
            options={[
              { label: 'Entry', value: 'entry' },
              { label: 'Mid', value: 'mid' },
              { label: 'Senior', value: 'senior' },
              { label: 'Lead', value: 'lead' },
              { label: 'Executive', value: 'executive' },
            ]}
          />
          <Select
            placeholder="Remote"
            allowClear
            value={remoteFilter}
            onChange={(v) => { setRemoteFilter(v); setPage(1); }}
            style={{ width: 120 }}
            options={[
              { label: 'Yes', value: 'true' },
              { label: 'No', value: 'false' },
            ]}
          />
        </Space>
      </Card>

      <Card
        style={{ background: '#111827', border: '1px solid #1E293B' }}
        bodyStyle={{ background: '#111827' }}
      >
        <Table
          columns={columns}
          data={jobs}
          loading={loading}
          stripe
          border={false}
          rowKey="id"
          scroll={{ x: 1300 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: true,
            onChange: (p) => setPage(p),
            style: { color: '#94A3B8' },
          }}
        />
      </Card>
    </div>
  );
}

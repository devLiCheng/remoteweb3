import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Input, Space, Popconfirm, Message,
  Typography, Card,
} from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import axios from 'axios';

const { Title } = Typography;

interface Company {
  id: number;
  name: string;
  industry: string;
  headquarters: string;
  job_count: number;
  is_verified: boolean;
}

export default function CompanyList() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: pageSize };
      if (search) params.search = search;

      const res = await axios.get('/api/companies', { params });
      setCompanies(res.data.data ?? res.data.companies ?? res.data ?? []);
      setTotal(res.data.total ?? res.data.count ?? 0);
    } catch {
      setCompanies([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/admin/companies/${id}`);
      Message.success('Company deleted successfully');
      fetchCompanies();
    } catch {
      Message.error('Failed to delete company');
    }
  };

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Name', dataIndex: 'name', width: 180 },
    { title: 'Industry', dataIndex: 'industry', width: 150 },
    { title: 'Headquarters', dataIndex: 'headquarters', width: 150 },
    {
      title: 'Job Count',
      dataIndex: 'job_count',
      width: 100,
      render: (v: number) => (
        <span style={{ color: '#06B6D4', fontWeight: 600 }}>{v ?? 0}</span>
      ),
    },
    {
      title: 'Verified',
      dataIndex: 'is_verified',
      width: 100,
      render: (v: boolean) => (
        <span
          style={{
            padding: '2px 10px',
            borderRadius: 4,
            fontSize: 12,
            background: v ? 'rgba(6,182,212,0.15)' : 'rgba(148,163,184,0.15)',
            color: v ? '#06B6D4' : '#94A3B8',
          }}
        >
          {v ? 'Verified' : 'Pending'}
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
            onClick={() => navigate(`/companies/${id}/edit`)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this company?"
            content="All associated jobs may be affected."
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
          Company Management
        </Title>
        <Button
          type="primary"
          icon={<IconPlus />}
          style={{ background: '#06B6D4', border: 'none' }}
          onClick={() => navigate('/companies/new')}
        >
          Add Company
        </Button>
      </div>

      <Card
        style={{ background: '#111827', border: '1px solid #1E293B', marginBottom: 16 }}
        bodyStyle={{ background: '#111827' }}
      >
        <Input.Search
          placeholder="Search companies..."
          allowClear
          searchButton
          onSearch={handleSearch}
          onChange={(v) => { if (!v) setSearch(''); }}
          style={{ width: 300 }}
        />
      </Card>

      <Card
        style={{ background: '#111827', border: '1px solid #1E293B' }}
        bodyStyle={{ background: '#111827' }}
      >
        <Table
          columns={columns}
          data={companies}
          loading={loading}
          stripe
          border={false}
          rowKey="id"
          scroll={{ x: 1000 }}
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

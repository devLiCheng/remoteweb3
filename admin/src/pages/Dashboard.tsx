import { useState, useEffect } from 'react';
import { Card, Statistic, Table, Skeleton, Grid } from '@arco-design/web-react';
import axios from 'axios';

const { Row, Col } = Grid;

interface JobStats {
  totalJobs: number;
  totalCompanies: number;
  activeJobs: number;
  newThisWeek: number;
}

interface RecentJob {
  id: number;
  title: string;
  company: string;
  date: string;
  status: 'active' | 'closed' | 'draft';
}

export default function Dashboard() {
  const [stats, setStats] = useState<JobStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get('/api/jobs/stats/overview');
        setStats({
          totalJobs: res.data.total_jobs ?? res.data.totalJobs ?? 0,
          totalCompanies: res.data.total_companies ?? res.data.totalCompanies ?? 0,
          activeJobs: res.data.active_jobs ?? res.data.activeJobs ?? 0,
          newThisWeek: res.data.new_this_week ?? res.data.newThisWeek ?? 0,
        });
        setRecentJobs(res.data.recent_jobs ?? res.data.recentJobs ?? []);
      } catch {
        // Demo fallback data
        setStats({
          totalJobs: 248,
          totalCompanies: 86,
          activeJobs: 192,
          newThisWeek: 34,
        });
        setRecentJobs([
          { id: 1, title: 'Solidity Developer', company: 'ChainLink Labs', date: '2026-05-18', status: 'active' },
          { id: 2, title: 'Frontend Engineer', company: 'Uniswap', date: '2026-05-17', status: 'active' },
          { id: 3, title: 'Smart Contract Auditor', company: 'OpenZeppelin', date: '2026-05-16', status: 'active' },
          { id: 4, title: 'Full Stack Developer', company: 'Aave', date: '2026-05-15', status: 'closed' },
          { id: 5, title: 'Rust Engineer', company: 'Solana Labs', date: '2026-05-14', status: 'active' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const columns = [
    { title: 'Title', dataIndex: 'title', width: 200 },
    { title: 'Company', dataIndex: 'company', width: 160 },
    { title: 'Date', dataIndex: 'date', width: 120 },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <span
          style={{
            padding: '2px 10px',
            borderRadius: 4,
            fontSize: 12,
            background: status === 'active' ? 'rgba(6,182,212,0.15)' : 'rgba(148,163,184,0.15)',
            color: status === 'active' ? '#06B6D4' : '#94A3B8',
          }}
        >
          {status}
        </span>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ color: '#E2E8F0', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
        Dashboard Overview
      </h2>

      {loading ? (
        <Skeleton
          loading
          animation
          text={{ rows: 4 }}
        />
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={12} md={6}>
              <Card
                style={{ background: '#111827', border: '1px solid #1E293B' }}
                bodyStyle={{ background: '#111827' }}
              >
                <Statistic
                  title={<span style={{ color: '#94A3B8', fontSize: 13 }}>Total Jobs</span>}
                  value={stats?.totalJobs ?? 0}
                  styleValue={{ color: '#E2E8F0', fontSize: 28, fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card
                style={{ background: '#111827', border: '1px solid #1E293B' }}
                bodyStyle={{ background: '#111827' }}
              >
                <Statistic
                  title={<span style={{ color: '#94A3B8', fontSize: 13 }}>Total Companies</span>}
                  value={stats?.totalCompanies ?? 0}
                  styleValue={{ color: '#E2E8F0', fontSize: 28, fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card
                style={{ background: '#111827', border: '1px solid #1E293B' }}
                bodyStyle={{ background: '#111827' }}
              >
                <Statistic
                  title={<span style={{ color: '#94A3B8', fontSize: 13 }}>Active Jobs</span>}
                  value={stats?.activeJobs ?? 0}
                  styleValue={{ color: '#06B6D4', fontSize: 28, fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card
                style={{ background: '#111827', border: '1px solid #1E293B' }}
                bodyStyle={{ background: '#111827' }}
              >
                <Statistic
                  title={<span style={{ color: '#94A3B8', fontSize: 13 }}>New This Week</span>}
                  value={stats?.newThisWeek ?? 0}
                  styleValue={{ color: '#22D3EE', fontSize: 28, fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card
                title={<span style={{ color: '#E2E8F0', fontWeight: 600 }}>Recent Jobs</span>}
                style={{ background: '#111827', border: '1px solid #1E293B' }}
                bodyStyle={{ background: '#111827' }}
              >
                <Table
                  columns={columns}
                  data={recentJobs}
                  stripe
                  border={false}
                  rowKey="id"
                  pagination={false}
                  style={{ background: 'transparent' }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card
                title={<span style={{ color: '#E2E8F0', fontWeight: 600 }}>Activity Overview</span>}
                style={{ background: '#111827', border: '1px solid #1E293B' }}
                bodyStyle={{ background: '#111827' }}
              >
                <div
                  style={{
                    height: 260,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    color: '#94A3B8',
                    borderRadius: 8,
                    background: 'rgba(30,41,59,0.4)',
                    border: '1px dashed #1E293B',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'rgba(6,182,212,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                      fontSize: 22,
                    }}
                  >
                    📊
                  </div>
                  <span style={{ fontSize: 14 }}>Chart Placeholder</span>
                  <span style={{ fontSize: 12, marginTop: 4, color: '#64748B' }}>
                    Connect a chart library (e.g. ECharts) here
                  </span>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}

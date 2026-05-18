import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Breadcrumb, Dropdown, Button, Message } from '@arco-design/web-react';
import {
  IconDashboard, IconStorage, IconFile, IconSettings, IconUser, IconPoweroff,
  IconTool, IconTag, IconLanguage, IconHome,
} from '@arco-design/web-react/icon';

const { Sider, Header, Content } = Layout;
const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;

const menuItems = [
  { key: '/dashboard', icon: <IconDashboard />, label: '仪表盘' },
  {
    key: '/content',
    icon: <IconStorage />,
    label: '内容管理',
    children: [
      { key: '/jobs', icon: <IconFile />, label: '职位管理' },
      { key: '/companies', icon: <IconHome />, label: '公司管理' },
      { key: '/tags', icon: <IconTag />, label: '标签管理' },
    ],
  },
  { key: '/settings', icon: <IconSettings />, label: '系统设置' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKeys = [location.pathname];
  const openKeys = menuItems
    .filter((item) => item.children?.some((child) => location.pathname.startsWith(child.key)))
    .map((item) => item.key);

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  const handleLogout = () => {
    Message.success('已退出登录');
    navigate('/login');
  };

  const getBreadcrumbs = () => {
    const crumbs = [{ label: '首页', path: '/dashboard' }];
    for (const item of menuItems) {
      if (item.children) {
        const child = item.children.find((c) => location.pathname.startsWith(c.key));
        if (child) {
          crumbs.push({ label: item.label!, path: '' });
          crumbs.push({ label: child.label, path: child.key });
          break;
        }
      } else if (location.pathname.startsWith(item.key)) {
        crumbs.push({ label: item.label!, path: item.key });
        break;
      }
    }
    return crumbs;
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        collapsible
        breakpoint="xl"
        style={{
          background: 'linear-gradient(180deg, #0A1628 0%, #111827 100%)',
          borderRight: '1px solid #1E293B',
        }}
        width={240}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderBottom: '1px solid #1E293B',
            padding: '0 16px',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #06B6D4, #22D3EE)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 16,
              color: '#0A0A14',
            }}
          >
            R
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: '#E2E8F0',
              fontFamily: '"Exo 2", sans-serif',
            }}
          >
            RemoteWeb3
          </span>
        </div>
        <Menu
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          onClickMenuItem={handleMenuClick}
          style={{
            background: 'transparent',
            color: '#94A3B8',
            marginTop: 8,
          }}
          theme="dark"
        >
          {menuItems.map((item) =>
            item.children ? (
              <SubMenu key={item.key} title={item.label}>
                {item.children.map((child) => (
                  <MenuItem key={child.key}>{child.label}</MenuItem>
                ))}
              </SubMenu>
            ) : (
              <MenuItem key={item.key}>{item.label}</MenuItem>
            ),
          )}
        </Menu>
      </Sider>
      <Layout>
        <Header
          style={{
            height: 64,
            background: 'rgba(17, 24, 39, 0.95)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
          }}
        >
          <Breadcrumb style={{ fontSize: 14 }}>
            {getBreadcrumbs().map((crumb, index) => (
              <Breadcrumb.Item key={index}>{crumb.label}</Breadcrumb.Item>
            ))}
          </Breadcrumb>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={<IconLanguage />}
              style={{ color: '#94A3B8' }}
            >
              中文
            </Button>
            <Dropdown
              droplist={
                <Menu>
                  <MenuItem key="profile">
                    <IconUser style={{ marginRight: 8 }} /> 个人设置
                  </MenuItem>
                  <MenuItem key="logout" onClick={handleLogout}>
                    <IconPoweroff style={{ marginRight: 8 }} /> 退出登录
                  </MenuItem>
                </Menu>
              }
              position="br"
            >
              <Button
                type="text"
                icon={<IconUser />}
                style={{ color: '#E2E8F0' }}
              >
                Admin
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            padding: 24,
            background: '#0A0A14',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

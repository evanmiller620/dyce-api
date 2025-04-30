import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import '@/assets/styles/Sidebar.css';
import Keys from "@/assets/icons/keys.svg";
import Wallets from "@/assets/icons/wallets.svg";
import Usage from "@/assets/icons/usage.svg";
import Hide from "@/assets/icons/hide.svg";

const Sidebar = () => {
  const [hide, setHide] = useState(false);

  return (
    <div className={`sidebar ${hide ? 'hide' : ''}`}>
      <ul>
        <li className="col sidebar-title" onClick={() => setHide(prev => !prev)}>
          <img src={Hide} height={24} />
          <label>DASHBOARD</label>
        </li>
        <NavItem to="/dashboard/keys" label="API Keys" icon={Keys} />
        <NavItem to="/dashboard/wallets" label="Wallets" icon={Wallets} />
        <NavItem to="/dashboard/usage" label="Usage" icon={Usage} />
      </ul>
    </div>
  );
};

const NavItem = ({ to, label, icon }) => (
  <NavLink to={to}>
    {({ isActive }) => (
        <li className={isActive ? 'active col' : 'col'}>
            <img src={icon} height={24} />
            <label>{label}</label>
        </li>)}
  </NavLink>
);

export default Sidebar;

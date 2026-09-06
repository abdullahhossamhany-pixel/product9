/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminOrders from './pages/AdminOrders';
import AdminProducts from './pages/AdminProducts';
import AdminPromoCodes from './pages/AdminPromoCodes';
import AdminRedeemRewards from './pages/AdminRedeemRewards';
import Cart from './pages/Cart';
import OrderHistory from './pages/OrderHistory';
import OrderStatus from './pages/OrderStatus';
import Orders from './pages/Orders';
import ProductDetail from './pages/ProductDetail';
import Redeem from './pages/Redeem';
import Store from './pages/Store';
import __Layout from './Layout.jsx';

export const PAGES = {
    "AdminOrders": AdminOrders,
    "AdminProducts": AdminProducts,
    "AdminPromoCodes": AdminPromoCodes,
    "AdminRedeemRewards": AdminRedeemRewards,
    "Cart": Cart,
    "OrderHistory": OrderHistory,
    "OrderStatus": OrderStatus,
    "Orders": Orders,
    "ProductDetail": ProductDetail,
    "Redeem": Redeem,
    "Store": Store,
}

export const pagesConfig = {
    mainPage: "Store",
    Pages: PAGES,
    Layout: __Layout,
};

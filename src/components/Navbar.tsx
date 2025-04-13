import { NavLink } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';

interface NavbarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/food-entry', label: 'Food Entry' },
    { path: '/database', label: 'Food Database' },
    { path: '/meal-templates', label: 'Meal Templates' },
    { path: '/goals', label: 'Goal Setting' },
    { path: '/reports', label: 'Reports' },
  ];

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-100 text-indigo-700'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <nav className="py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900">Macro Tracker</h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={navLinkClasses}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            {isMobileMenuOpen ? (
              <FaTimes className="block h-6 w-6" />
            ) : (
              <FaBars className="block h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4">
          <div className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={navLinkClasses}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 
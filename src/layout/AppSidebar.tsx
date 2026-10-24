import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import Cookies from "js-cookie";

// Assume these icons are imported from an icon library
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import { useWorkout } from "../context/WorkoutContext";
import ChatBox from "../components/Chats/ChatBox";
import Services from "../components/tables/BasicTables/Services";
interface Service {
  cart_item: string;
  price:number;
  coach_id:number;
  user_id:number;
  cartId:number;
}
type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};


const othersItems: NavItem[] = [
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin", pro: false },
      { name: "Sign Up", path: "/signup", pro: false },
    ],
  },
];

const AppSidebar: React.FC = () => {
    useEffect(() => {
      const Role = Cookies.get("userrole");
      if(Role){
        setuserRole(Role);
      }
    }, []);
const [userRole, setuserRole] = useState<string | null>(null);
const [services, setservices] = useState<Service[]>([]);
const { formData, setFormData, startWorkout } = useWorkout();
const [loading, setLoading] = useState(true);
const [role,setrole] = useState("");
const hasPrivateCoach = services.some(
  (service) => service.cart_item === "PRIVATE COACH"
);
const hasPrivateDiet = services.some(
  (service) => service.cart_item === "Diet scheduale"
);
const hasPrivateGymscheduale = services.some(
  (service) => service.cart_item === "Gym scheduale"
);
const hasAI= services.some(
  (service) => service.cart_item === "AI health analysis"
);
const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [{ name: "Fitness", path: "/", pro: false }],
  },
  {
    icon: <UserCircleIcon />,
    name: "User Profile",
    path: "/profile",
  },
  {
  name: "Training Planner",
  icon: <CalenderIcon />,
  subItems: [
    { name: "Smart Weekly Planner", path: "/smart-weekly-planner", pro: false },
  ],
},
  ...(userRole !== "ADMIN" ? [
  {
    name: "Forms",
    icon: <ListIcon />,
    subItems: [{ name: "Fitness Elements", path: "/form-elements", pro: false }],
  }
] : []),
{
  name: "Exercise Graph",
  icon: <TableIcon />,
  subItems: [
    { name: "Exercise Library", path: "/exercise-library", pro: false },
    { name: "Find Substitute", path: "/find-substitute", pro: false },
    { name: "Progression Roadmap", path: "/progression-roadmap", pro: false },
  ],
},

  {
    name: "Tables",
    icon: <TableIcon />,
    subItems:
      role === "COACH"
        ? [
            { name: "Users tables", path: "/basic-tables", pro: false },
            { name: "Goal tables", path: "/goal-tables", pro: false },
          ]
        : [
            { name: "Users tables", path: "/basic-tables", pro: false },
            { name: "Workouts tables", path: "/workouts-tables", pro: false },
            { name: "Health metrics tables", path: "/health-tables", pro: false },
            { name: "Goal tables", path: "/goal-tables", pro: false },
            { name: "food tables", path: "/food-tables", pro: false },
            { name: "Service tables", path: "/service-tables", pro: false },
          ],
  },
  //     ...(role != "ADMIN" && role != "COACH"
  //   ? [
  //   {
  //   name: "Gym exercise",
  //    icon: <TableIcon />,
  //   subItems: [
  //     { name: "Add gym exercise", path: "/addworkouts", pro: false },
  //     { name: "Track gym exercise", path: "/trackworkouts", pro: false },
  //   ],
  // }
  //     ]
  //   : []),
      ...(hasAI && role != "ADMIN"
    ? [
   {
    name: "AI Body analysis",
     icon: <TableIcon />,
    subItems: [
      { name: "Get Recommendation", path: "/getrecommend", pro: false },
    ],
  }, {
    name: "AI Chat",
     icon: <TableIcon />,
    subItems: [
      { name: "Coach chat AI", path: "/aichat", pro: false },
    ],
  }
      ]
    : []),{
  name: "Nutrition",
  icon: <PieChartIcon />,
  subItems: [
    { name: "Smart Meal Planner", path: "/smart-meal-planner", pro: false, new: true },
  ],
  },
    ...(hasPrivateDiet && role != "ADMIN" && role != "COACH"
    ? [
      {
        name: "Diet",
        icon: <TableIcon />,
        subItems: [
            { name: "Add Diet", path: "/adddiet", pro: false },
            ],
      }
      ]
    : []),
//  ...(hasPrivateGymscheduale && role != "ADMIN" && role != "COACH"
//     ? [
//       {
//     name: "Gym scheduale",
//      icon: <TableIcon />,
//     subItems: [
//       { name: "Add Gym Scheduale", path: "/addgymscheduale", pro: false },
//     ],
//       }
//       ]
//     : []),
  ...((hasPrivateCoach || role === "COACH")
    ? [
        {
          name: "Chat",
          icon: <TableIcon />,
          subItems: [
            {
              name: "Chat",
              path: "/chatbox",
              pro: false,
            },
          ],
        },
      ]
    : []),
  ...((hasPrivateCoach || role === "COACH")
    ? [
        {
          name: "Scheduling",
          icon: <CalenderIcon />,
          subItems: [
            {
              name: "Trainer & Equipment Scheduler",
              path: "/resource-scheduler",
              pro: false,
            },
          ],
        },
      ]
    : []),
];

  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );
  const fetchService = async () => {
    try {
      const token = Cookies.get("token");

      const userId = Cookies.get("userId");

      if (!token) {
        throw new Error("Unauthorized");
      }

      const role = await fetch("https://fitness-backend-15563671567.europe-west8.run.app/users/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!role.ok) {
        throw new Error("Failed to fetch foods");
      }else{
        const Role = await role.json();
        setrole(Role.role);
        const url = `https://fitness-backend-15563671567.europe-west8.run.app/cart/findbyuserid/${userId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch foods");
      }
      const data = await response.json();
        if(Role.role === "COACH"){
          setFormData(prev => ({ ...prev, chatroomnumber:userId}))
        }else{
          if(data.some((item: { cart_item: string; }) => item.cart_item === "PRIVATE COACH")){
            const coachid = data.filter((item: { cart_item: string; }) => item.cart_item === "PRIVATE COACH")[0].coach_id
            const url = `https://fitness-backend-15563671567.europe-west8.run.app/chatroom/coach/${Number(coachid)}`;
            const response = await fetch(url, {
              method: "GET",
              headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
          },
          });
          const datas = await response.json();
          setFormData(prev => ({ ...prev, chatroom_id_number:datas[0].chatroom_id }))
          console.log("update")
          if(datas[0].user_id === null){
            setFormData(prev => ({ ...prev, chatroom__free:true}))
          }
          setFormData(prev => ({ ...prev, chatroom__free:false}))
            setFormData(prev => ({ ...prev, chatroomnumber:coachid}))
          }
        }
      setservices(data);
      }
    } catch (error) {
      console.error("Error fetching foods:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchService();
  }, []);
  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
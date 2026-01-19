export const API_BASE_URL = "https://sookebackend.odhostestingweblinks.com/api";

export const ENDPOINTS = {
  LOGIN: "/auth/login",
  CHANGEPASSWORD: "/profile/change-password",
  // TESTIMONIAL: {
  //   LIST: "/testimonial/admin",
  //   CREATE: "/testimonial/create",
  //   Delete: (id: string) => `/testimonial/update-status/${id}`,
  //   GET_BY_ID: (id: string | number) => `/testimonial/getById/${id}`,
  //   UPDATE: (id: string | number) => `/testimonial/update/${id}`,
  // },
  CATEGORY: {
    LIST: "/category/admin",
    CREATE: "/category/create",
    Delete: (guid: string) => `/category/update-status/${guid}`,
    GET_BY_GUID: (guid: string) => `/category/getByGuid/${guid}`,
    UPDATE: (guid: string) => `/category/update/${guid}`,
    UPDATE_ACTIVE: (guid: string) => `/category/update-active/${guid}`,
  },
  // PRODUCT: {
  //   LIST: "/product/admin", // Returns "categories" key
  //   CREATE: "/product/create",
  //   Delete: (guid: string) => `/product/update-status/${guid}`,
  //   GET_BY_GUID: (guid: string) => `/product/getByGuid/${guid}`,
  //   UPDATE: (guid: string) => `/product/update/${guid}`,
  // },
  BLOG: {
    LIST: "/blog/admin",
    CREATE: "/blog/create",
    SEARCH: "/blog/search",
    Delete: (id: string) => `/blog/update-status/${id}`,
    GET_BY_ID: (id: string | number) => `/blog/getById/${id}`,
    UPDATE: (id: string | number) => `/blog/update/${id}`,
  },
  ABOUT: {
    LIST: "/about",
    CREATE: "/about/store",
  },
  ORDERS: {
    LIST: "/order/admin",
    GET_BY_ID: (orderId: string) => `/order/getById/${orderId}`,
  },
  BOOKSERVICES: {
    LIST: "/service/all-bookings",
    GET_BY_ID: (guid: string) => `/service/get-booking/${guid}`,
    UPDATESTATUS: (guid: string) => `/service/status-booking/${guid}`,
  },
  SERVICES: {
    LIST: "/service/admin",
    CREATE: "/service/create",
    Delete: (id: string) => `/service/update-status/${id}`,
    GET_BY_ID: (id: string | number) => `/service/getByGuid/${id}`,
    UPDATE: (id: string | number) => `/service/update/${id}`,
  },
  ENQUERIES: {
    LIST: "/enquiry",
  },
  NEWSLETTER: {
    LIST: "/newsletter/all",
  }
};
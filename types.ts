export interface User {
  id: number;
  name: string;
  email: string;
  token: string;
  profile_image?: string;
}

export interface Media {
  id: number;
  file_name: string;
  original_url: string;
  mime_type: string;
}

export interface Testimonial {
  id: number;
  name: string;
  message: string;
  rating: number;
  status: number;
  created_at: string;
  media: Media[];
  order_by: number;
}

export interface Service {
  id: number;
  guid: string;
  title: string;
  description: string;
  price: string | number;
  status: number;
  order_by: number;
  created_at: string;
  updated_at: string;
}


export interface Category {
  order_by: any;
  title: any;
  cover: any;
  media: any;
  id: number;
  guid: string;
  name: string;
  image_url?: Media[];
  description: string;
  status: number;
  product_count?: number;
  created_at: string;
}

export interface Product {
  id: number;
  guid: string;
  title: string;
  short_description: string;
  long_description: string;
  price: string;
  sale_price: string;
  category_id: number;
  category?: Category;
  cover?: Media[];
  images?: Media[];
  created_at: string;
}

export interface Blog {
  id: number;
  title: string;
  description: string;
  image?: Media[];
  transcript?: Media[];
  category_guid?: number;
  publish_date?: string;
  status: number;
  user_id: number;
  formatted_date: string;
  created_at: string;
  media: Media[];
  cover: Media[];
}
export interface AboutContent {
  id: number;
  title: string;
  description: string;
  long_description: string;
  image_url?: string;
  cover_url?: string;
  media?: Media[];
}


export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: string;
  product: Product;
}

export interface Order {
  id: number;
  orderid: string; // Public facing ID e.g., "o9orcb4t"
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  user_id: number;
  total_price: string;
  note: string;
  address: string;
  city: string;
  country: string;
  zip_code: string;
  state: string;
  payment_status: string;
  paypal_order_id: string;
  created_at: string;
  date: string; // e.g., "Nov-30-2025"
  order_product_id: OrderItem[]; // Weird naming from backend, but contains the items
}
export interface Pagination {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  remaining: number;
  next_page: number | null;
  prev_page: number | null;
}
export interface Enquiry {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export interface Newsletter {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  status: boolean;
  data: User;
  message: string;
}

export interface ApiResponse<T> {
  status: boolean;
  data: T;
  message: string;
}

export interface ServiceListResponse {
  services: Service[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    remaining: number;
    next_page: number;
    prev_page: number;
  };
}

export interface SingleServiceResponse {
  service: Service;
}

export interface PaginatedResponse<T> {
  status: boolean;
  data: {
    [key: string]: T[] | any; // Dynamic key handling for "categories" vs "testimonials"
    pagination: {
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    }
  };
  message: string;
}

export interface Booking {
  id: number;
  guid: string;
  booking_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  amount: string;
  user_id: number;
  service_id: number;
  approved: number; // 0: pending, 1: approved, 2: rejected
  payment_status: string;
  approved_date: string | null;
  approved_time: string | null;
  created_at: string;
  updated_at: string;
  date: string;
  bought: boolean;
  service: Service;
  user?: User;
}
export interface BookingListResponse {
  bookings: Booking[];
  pagination: Pagination;
}

export interface SingleBookingResponse {
  booking: Booking;
}
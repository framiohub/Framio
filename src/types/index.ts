export type FrameMaterial = 'wood-walnut' | 'wood-oak' | 'wood-white' | 'metal-black' | 'metal-gold' | 'metal-silver' | 'acrylic';
export type FrameSize = '6x8' | '8x10' | '12x16';
export type FrameType = 'single' | 'collage-3' | 'collage-5' | 'collage-9' | 'couple' | 'led' | 'desk' | 'wall-set';
export type OrderStatus = 'processing' | 'printing' | 'packed' | 'shipped' | 'delivered';

export interface ProductSize {
  label: string;
  value: FrameSize;
  price: number;
}

export interface ProductMaterial {
  label: string;
  value: FrameMaterial;
  priceAdder: number;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  type: FrameType;
  sizes: ProductSize[];
  materials: ProductMaterial[];
  images: string[];
  badge?: string;
  rating: number;
  reviewCount: number;
  occasion: string[];
  photoSlots: number;
  featured?: boolean;
}

export interface CartCustomization {
  photoUrl?: string;
  name?: string;
  date?: string;
  message?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  selectedSize: string;
  selectedSizeLabel: string;
  selectedMaterial: string;
  selectedMaterialLabel: string;
  materialColor: string;
  quantity: number;
  unitPrice: number;
  customization?: CartCustomization;
}

export interface Order {
  id: string;
  userId?: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  createdAt: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shippingAddress: Address;
  estimatedDelivery?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  customPhotoUrl: string;
  customText: string;
  quantity: number;
  price: number;
  selectedSize: FrameSize;
  selectedMaterial: FrameMaterial;
  previewDataUrl?: string;
}

export interface Address {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  photoUrl?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: Address;
}

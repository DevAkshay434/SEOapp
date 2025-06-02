import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import ShopifyImageViewer from '../components/ShopifyImageViewer';
import { useQuery } from '@tanstack/react-query';
import { SchedulingPermissionNotice } from '../components/SchedulingPermissionNotice';
import { ContentStyleSelector } from '../components/ContentStyleSelector';
import ProjectCreationDialog from '../components/ProjectCreationDialog';
import { ChooseMediaDialog, MediaImage } from '../components/ChooseMediaDialog';
import { RelatedProductsSelector } from '../components/RelatedProductsSelector';
import { RelatedCollectionsSelector } from '../components/RelatedCollectionsSelector';
import { ProductMultiSelect } from '../components/ProductMultiSelect';
import MediaSelectionStep from '../components/MediaSelectionStep';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart, 
  Calendar, 
  CalendarCheck,
  CheckCircle,
  Check,
  PlusCircle,
  CircleDot,
  CheckSquare,
  ChevronLeft,
  ImagePlus,
  ChevronRight,
  Clock, 
  Copy,
  Cpu,
  Download,
  ExternalLink, 
  FileImage,
  FileText,
  FileVideo,
  FolderOpen,
  Folders,
  Gem,
  Heart,
  Image as ImageIcon,
  Info,
  LayoutGrid,
  Pencil,
  ShoppingBag,
  Leaf,
  Loader2,
  Package,
  PiggyBank,
  Plus, 
  RefreshCw,
  Save, 
  Search,
  Send,
  Store,
  Upload,
  User,
  Users,
  Zap,
  ShoppingCart,
  Sparkles, 
  Trash, 
  Type,
  X, 
  XCircle 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MultiSelect } from '@/components/ui/multi-select';
import { Badge } from '@/components/ui/badge';
import KeywordSelector from '@/components/KeywordSelector';
import TitleSelector from '@/components/TitleSelector';
import ImageSearchDialog from '@/components/ImageSearchDialog';
import ImageSearchSuggestions from '@/components/ImageSearchSuggestions';
import CreatePostModal from '@/components/CreatePostModal';

// Define the form schema for content generation
const contentFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  region: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
  articleType: z.enum(["blog", "page"]),
  blogId: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  writingPerspective: z.enum(["first_person_singular", "first_person_plural", "second_person", "third_person"]),
  enableTables: z.boolean().default(true),
  enableLists: z.boolean().default(true),
  enableH3s: z.boolean().default(true),
  introType: z.enum(["none", "standard", "search_intent"]),
  faqType: z.enum(["none", "short", "long"]),
  enableCitations: z.boolean().default(true),
  // Removed non-functional image fields
  toneOfVoice: z.enum(["neutral", "professional", "empathetic", "casual", "excited", "formal", "friendly", "humorous"]),
  postStatus: z.enum(["publish", "draft"]),
  generateImages: z.boolean().default(true),
  scheduledPublishDate: z.string().optional(), // Added for future scheduling date
  scheduledPublishTime: z.string().optional(),  // Added for future scheduling time
  // Fields needed for scheduling functionality
  publicationType: z.enum(["publish", "schedule", "draft"]).optional(),
  scheduleDate: z.string().optional(),
  scheduleTime: z.string().optional(),
  // New fields for content generation
  articleLength: z.enum(["short", "medium", "long", "comprehensive"]).default("long"),
  headingsCount: z.enum(["2", "3", "4", "5", "6"]).default("3"),
  // Custom category fields
  categories: z.array(z.string()).optional(),
  customCategory: z.string().optional()
});

type ContentFormValues = z.infer<typeof contentFormSchema>;

interface Region {
  id: string;
  name: string;
}

interface ProductVariant {
  id: string;
  title: string;
  price: string;
  image?: string;
  inventory_quantity?: number;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  image?: string;
  body_html?: string;
  admin_url?: string;
  images?: {
    id: string;
    src: string;
    alt?: string;
    position?: number;
  }[];
  variants?: ProductVariant[];
}

interface Collection {
  id: string;
  title: string;
  handle: string;
  image?: string;
}

interface Blog {
  id: string;
  title: string;
  handle: string;
}

interface BuyerPersona {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface ServiceStatus {
  shopify: boolean;
  claude: boolean;
  dataForSEO: boolean;
  pexels: boolean;
}

// Interface for Pexels image 
interface PexelsImage {
  id: string;
  url: string;
  width: number;
  height: number;
  alt?: string;
  src?: {
    original: string;
    large: string;
    medium: string;
    small: string;
    thumbnail: string;
  };
  photographer?: string;
  photographer_url?: string;
  selected?: boolean;
  isPrimary?: boolean;
  type?: 'image' | 'youtube';
  videoId?: string;
  source?: 'product' | 'variant' | 'shopify' | 'pexels' | 'product_image' | 'theme_asset' | 'article_image' | 'collection_image' | 'shopify_media' | 'variant_image' | 'uploaded';
}

// Predefined categories for content
const predefinedCategories = [
  { id: "featured", name: "Featured" },
  { id: "new", name: "New Arrivals" },
  { id: "selected", name: "Selected" },
  { id: "trending", name: "Trending" },
  { id: "popular", name: "Popular" },
  { id: "seasonal", name: "Seasonal" },
  { id: "sale", name: "On Sale" },
  { id: "guides", name: "Buying Guides" },
  { id: "how-to", name: "How-To" },
];

// Predefined buyer personas for content targeting
const predefinedBuyerPersonas: BuyerPersona[] = [
  { 
    id: "budget_conscious", 
    name: "Budget-Conscious Shopper", 
    description: "Price-sensitive customers looking for the best deals and value", 
    icon: "piggy-bank" 
  },
  { 
    id: "luxury_seeker", 
    name: "Luxury Seeker", 
    description: "Premium shoppers willing to pay more for quality and exclusivity", 
    icon: "gem" 
  },
  { 
    id: "convenience_focused", 
    name: "Convenience Focused", 
    description: "Time-starved customers who value ease and simplicity over price", 
    icon: "zap" 
  },
  { 
    id: "eco_conscious", 
    name: "Eco-Conscious Consumer", 
    description: "Environmentally aware shoppers who prioritize sustainability", 
    icon: "leaf" 
  },
  { 
    id: "tech_savvy", 
    name: "Tech-Savvy", 
    description: "Early adopters who appreciate innovative features and technology",
    icon: "cpu" 
  },
  { 
    id: "research_driven", 
    name: "Research-Driven Buyer", 
    description: "Detail-oriented customers who thoroughly compare options before purchase", 
    icon: "search" 
  },
  { 
    id: "impulse_buyer", 
    name: "Impulse Buyer", 
    description: "Spontaneous shoppers who make quick decisions based on emotion", 
    icon: "zap-fast" 
  },
  { 
    id: "health_conscious", 
    name: "Health & Wellness Focused", 
    description: "Customers prioritizing products that contribute to wellbeing", 
    icon: "heart" 
  },
  {
    id: "parents",
    name: "Parents & Families",
    description: "Shopping for household needs with children's interests in mind",
    icon: "users"
  }
];

export default function AdminPanel() {
  const [selectedTab, setSelectedTab] = useState("generate");
  const [selectedContentToneId, setSelectedContentToneId] = useState<string>("");
  const [selectedContentDisplayName, setSelectedContentDisplayName] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [contentEditorKey, setContentEditorKey] = useState(0); // Force re-render of editor
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState<string>('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchedImages, setSearchedImages] = useState<PexelsImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<PexelsImage[]>([]);
  const [primaryImages, setPrimaryImages] = useState<PexelsImage[]>([]);
  const [secondaryImages, setSecondaryImages] = useState<PexelsImage[]>([]);
  const [showChooseMediaDialog, setShowChooseMediaDialog] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [shopifyFiles, setShopifyFiles] = useState<PexelsImage[]>([]);
  
  // Media selection state - initialized with empty values
  const [selectedMediaContent, setSelectedMediaContent] = useState<{
    primaryImage: MediaImage | null;
    secondaryImages: MediaImage[];
    youtubeEmbed: string | null;
  }>({
    primaryImage: null,
    secondaryImages: [],
    youtubeEmbed: null
  });
  
  // Add logging to track state changes
  console.log('Current selectedMediaContent state:', selectedMediaContent);
  
  // Workflow step state
  const [currentStep, setCurrentStep] = useState<string>("product");
  
  const [shopifyMediaType, setShopifyMediaType] = useState<'products' | 'variants' | 'media'>('products');
  
  // Function to fetch product images for selected products
  const fetchProductImages = async (includeVariants: boolean = false) => {
    try {
      setIsLoadingMedia(true);
      setShopifyFiles([]);
      
      if (selectedProducts.length === 0) {
        toast({
          title: "No products selected",
          description: "Please select at least one product to view images",
          variant: "destructive"
        });
        setIsLoadingMedia(false);
        return;
      }
      
      // Extract images from the selected products
      const productImages: PexelsImage[] = [];
      let uniqueImageUrls = new Set<string>();
      
      selectedProducts.forEach(product => {
        // Add main product image
        if (product.image && product.image.src) {
          const imageUrl = product.image.src;
          if (!uniqueImageUrls.has(imageUrl)) {
            uniqueImageUrls.add(imageUrl);
            productImages.push({
              id: `product-${product.id}-main`,
              url: imageUrl,
              width: 500,
              height: 500,
              alt: product.title || 'Product image',
              src: {
                original: imageUrl,
                large: imageUrl,
                medium: imageUrl,
                small: imageUrl,
                thumbnail: imageUrl
              },
              selected: false,
              source: 'shopify'
            });
          }
        }
        
        // Add additional product images
        if (product.images && Array.isArray(product.images)) {
          product.images.forEach((image, index) => {
            if (image.src && (!product.image || image.id !== product.image.id)) {
              // Skip the main image (already added above)
              const imageUrl = image.src;
              if (!uniqueImageUrls.has(imageUrl)) {
                uniqueImageUrls.add(imageUrl);
                productImages.push({
                  id: `product-${product.id}-image-${index}`,
                  url: imageUrl,
                  width: 500,
                  height: 500,
                  alt: image.alt || `${product.title} - Image ${index + 1}`,
                  src: {
                    original: imageUrl,
                    large: imageUrl,
                    medium: imageUrl,
                    small: imageUrl,
                    thumbnail: imageUrl
                  },
                  selected: false,
                  source: 'shopify'
                });
              }
            }
          });
        }
        
        // Add variant images if requested
        if (includeVariants && product.variants && Array.isArray(product.variants)) {
          product.variants.forEach((variant, variantIndex) => {
            if (variant.image && variant.image.src) {
              const imageUrl = variant.image.src;
              if (!uniqueImageUrls.has(imageUrl)) {
                uniqueImageUrls.add(imageUrl);
                productImages.push({
                  id: `variant-${variant.id}`,
                  url: imageUrl,
                  width: 500,
                  height: 500,
                  alt: `${product.title} - ${variant.title || `Variant ${variantIndex + 1}`}`,
                  src: {
                    original: imageUrl,
                    large: imageUrl,
                    medium: imageUrl,
                    small: imageUrl,
                    thumbnail: imageUrl
                  },
                  selected: false,
                  source: 'shopify'
                });
              }
            }
          });
        }
      });
      
      setShopifyFiles(productImages);
      
      console.log(`Loaded ${productImages.length} product images (${uniqueImageUrls.size} unique)`);
      
      toast({
        title: `${productImages.length} images found`,
        description: includeVariants 
          ? "Showing product and variant images" 
          : "Showing product images"
      });
      
    } catch (error) {
      console.error('Error processing product images:', error);
      toast({
        title: "Error loading images",
        description: "There was a problem processing product images",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMedia(false);
    }
  };

  // Function to fetch product and variant images from selected products
  const fetchProductAndVariantImages = async () => {
    try {
      setIsLoadingMedia(true);
      setShopifyFiles([]);
      
      if (selectedProducts.length === 0) {
        toast({
          title: "No products selected",
          description: "Please select at least one product in Step 2 first.",
          variant: "destructive"
        });
        setIsLoadingMedia(false);
        return;
      }
      
      toast({
        title: "Loading product images",
        description: `Loading images from ${selectedProducts.length} selected product(s)...`
      });
      
      // Collect all images from selected products and their variants
      const productImages: any[] = [];
      
      for (const product of selectedProducts) {
        // Add main product images
        if (product.images && Array.isArray(product.images)) {
          product.images.forEach((image: any, index: number) => {
            const imageUrl = typeof image === 'string' ? image : image.src;
            if (imageUrl) {
              productImages.push({
                id: `product-${product.id}-image-${image.id || index}`,
                url: imageUrl,
                width: 500,
                height: 500,
                alt: `${product.title} - Image ${index + 1}`,
                title: `${product.title} - Image ${index + 1}`,
                source: 'product_image',
                product_id: product.id,
                product_title: product.title,
                selected: false,
                src: {
                  original: imageUrl,
                  large: imageUrl,
                  medium: imageUrl,
                  small: imageUrl,
                  thumbnail: imageUrl
                }
              });
            }
          });
        } else if (product.image) {
          // Add single product image if no images array
          const imageUrl = typeof product.image === 'string' ? product.image : (product.image.src || '');
          if (imageUrl) {
            productImages.push({
              id: `product-${product.id}-main`,
              url: imageUrl,
              width: 500,
              height: 500,
              alt: product.title || 'Product image',
              title: `${product.title} - Main Image`,
              source: 'product_image',
              product_id: product.id,
              product_title: product.title,
              selected: false,
              src: {
                original: imageUrl,
                large: imageUrl,
                medium: imageUrl,
                small: imageUrl,
                thumbnail: imageUrl
              }
            });
          }
        }
        
        // Add variant images
        if (product.variants && Array.isArray(product.variants)) {
          product.variants.forEach((variant: any, variantIndex: number) => {
            if (variant.image) {
              const variantImageUrl = typeof variant.image === 'string' ? variant.image : (variant.image.src || '');
              if (variantImageUrl) {
                productImages.push({
                  id: `variant-${variant.id}-image`,
                  url: variantImageUrl,
                  width: 500,
                  height: 500,
                  alt: `${variant.title || 'Variant'} - ${product.title}`,
                  title: `${product.title} - ${variant.title || `Variant ${variantIndex + 1}`}`,
                  source: 'variant_image',
                  product_id: product.id,
                  product_title: product.title,
                  variant_id: variant.id,
                  variant_title: variant.title,
                  selected: false,
                  src: {
                    original: variantImageUrl,
                    large: variantImageUrl,
                    medium: variantImageUrl,
                    small: variantImageUrl,
                    thumbnail: variantImageUrl
                  }
                });
              }
            }
          });
        }
      }
      
      // If no images found, show a message
      if (productImages.length === 0) {
        toast({
          title: "No product images found",
          description: "The selected products don't have any images.",
          variant: "destructive"
        });
        setIsLoadingMedia(false);
        return;
      }
      
      // Set the product images to display
      setShopifyFiles(productImages);
      toast({
        title: "Product Images Loaded",
        description: `Loaded ${productImages.length} images from your selected products and their variants.`
      });
      
      setIsLoadingMedia(false);
    } catch (error) {
      console.error('Error fetching product images:', error);
      toast({
        title: "Error",
        description: "Failed to load product images",
        variant: "destructive"
      });
      setIsLoadingMedia(false);
    }
  };

  
  
  // Function to fetch images for a specific product by ID
  const fetchProductImagesById = async (productId: string) => {
    try {
      setIsLoadingContentFiles(true);
      toast({
        title: "Loading product images",
        description: "Fetching images for the selected product..."
      });
      
      // Use the dedicated endpoint for product-specific images
      const productImagesResponse = await fetch(`/api/admin/product-images/${productId}`);
      const productImagesData = await productImagesResponse.json();
      
      if (productImagesData.success && productImagesData.files && productImagesData.files.length > 0) {
        // Format the product images for our UI
        const productImages = productImagesData.files.map(file => ({
          id: `product-${file.id || Math.random().toString(36).substring(7)}`,
          url: file.url,
          name: file.filename || 'Product Image',
          alt: file.alt || file.filename || 'Product Image',
          content_type: file.content_type || 'image/jpeg',
          source: file.source || 'product_image',
          position: file.position || 0
        }));
        
        // Sort by position to show main product image first
        productImages.sort((a, b) => (a.position || 0) - (b.position || 0));
        
        setContentFiles(productImages);
        toast({
          title: "Product images loaded",
          description: `${productImages.length} images loaded for this product`,
        });
      } else {
        toast({
          title: "No product images found",
          description: "This product doesn't have any images",
          variant: "destructive"
        });
        setContentFiles([]);
      }
    } catch (error) {
      console.error('Error fetching product images:', error);
      toast({
        title: "Error loading product images",
        description: "There was a problem fetching images for this product",
        variant: "destructive"
      });
      setContentFiles([]);
    } finally {
      setIsLoadingContentFiles(false);
    }
  };
  
  // Legacy function for backward compatibility
  const fetchShopifyFiles = async () => {
    // By default, fetch from media library only
    await fetchShopifyMediaFiles();
  };
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<{url: string, id: string}[]>([]);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageSource, setImageSource] = useState<'pexels' | 'pixabay' | 'shopify_media' | 'product_images' | 'upload' | 'youtube'>('pexels');
  const [mediaTypeSelection, setMediaTypeSelection] = useState<'products' | 'variants' | 'media'>('products');
  const [contentFiles, setContentFiles] = useState<any[]>([]);
  const [isLoadingContentFiles, setIsLoadingContentFiles] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [currentImageEdit, setCurrentImageEdit] = useState<{id: string, alt: string}>({id: '', alt: ''});
  const [imageTab, setImageTab] = useState<'primary' | 'secondary'>('primary');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [youtubeVideoId, setYoutubeVideoId] = useState<string>('');
  const [showKeywordSelector, setShowKeywordSelector] = useState(false);
  const [showTitleSelector, setShowTitleSelector] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Collection[]>([]);
  const [selectedBuyerPersonas, setSelectedBuyerPersonas] = useState<string[]>([]);
  const [productTitle, setProductTitle] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [productDescription, setProductDescription] = useState<string>('');
  type WorkflowStep = 'product' | 'related-products' | 'related-collections' | 'buying-avatars' | 'keyword' | 'title' | 'media' | 'content';
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('product');
  const [forceUpdate, setForceUpdate] = useState(0); // Used to force UI re-renders
  
  // Project Creation Dialog state
  const [projectDialogOpen, setProjectDialogOpen] = useState(true); // Set to true to show by default
  const [currentProject, setCurrentProject] = useState<string>(() => {
    return localStorage.getItem('current-project') || '';
  });
  const [customCategories, setCustomCategories] = useState<{id: string, name: string}[]>(() => {
    // Load custom categories from localStorage
    const savedCategories = localStorage.getItem('topshop-custom-categories');
    return savedCategories ? JSON.parse(savedCategories) : [];
  });
  const [templates, setTemplates] = useState<{name: string, data: any}[]>(() => {
    // Load templates from localStorage on initial render
    const savedTemplates = localStorage.getItem('topshop-templates');
    return savedTemplates ? JSON.parse(savedTemplates) : [];
  });
  const [templateName, setTemplateName] = useState<string>('');
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showLoadTemplateDialog, setShowLoadTemplateDialog] = useState(false);
  const [imageSearchHistory, setImageSearchHistory] = useState<{query: string, images: PexelsImage[]}[]>([]);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const { toast } = useToast();

  // Default form values
  const defaultValues: Partial<ContentFormValues> = {
    articleType: "blog",
    writingPerspective: "first_person_plural",
    enableTables: true,
    enableLists: true,
    enableH3s: true,
    introType: "search_intent", // Changed from "standard" to "search_intent"
    faqType: "short",
    enableCitations: true,
    toneOfVoice: "friendly",
    postStatus: "draft",
    generateImages: true,
    region: "us", // Default to US region for store
    keywords: [],
    productIds: [], // This needs to be initialized as an empty array
    collectionIds: [], // This needs to be initialized as an empty array
    scheduledPublishTime: "09:30", // Default to 9:30 AM
    blogId: "", // Initialize with empty string to ensure the field exists
    // Scheduling fields
    publicationType: "draft",
    scheduleDate: undefined,
    scheduleTime: "09:30",
    // New fields
    articleLength: "long",
    headingsCount: "3",
    // Category fields
    categories: [],
    customCategory: ""
  };

  // Form setup
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues
  });

  // Define response types
  interface RegionsResponse {
    regions: Array<Region>;
  }
  
  interface ProductsResponse {
    success: boolean;
    products: Array<Product>;
  }
  
  interface CollectionsResponse {
    success: boolean;
    collections: Array<Collection>;
  }
  
  interface BlogsResponse {
    success: boolean;
    blogs: Array<Blog>;
  }
  
  interface ServiceStatusResponse {
    success: boolean;
    connections: ServiceStatus;
  }

  // Query for regions
  const regionsQuery = useQuery<RegionsResponse>({
    queryKey: ['/api/admin/regions'],
    enabled: selectedTab === "generate"
  });

  // Query for products
  const productsQuery = useQuery<ProductsResponse>({
    queryKey: ['/api/admin/products'],
    enabled: selectedTab === "generate"
  });

  // Query for collections
  const collectionsQuery = useQuery<CollectionsResponse>({
    queryKey: ['/api/admin/collections'],
    enabled: selectedTab === "generate"
  });
  
  // Check if the store has the scheduling permission
  const { data: permissionsData } = useQuery<{ 
    success: boolean; 
    hasPermission: boolean;
    store: { name: string; }
  }>({
    queryKey: ['/api/shopify/check-permissions'],
    enabled: true,
    onSuccess: (data) => {
      console.log('Permissions check result:', data);
    }
  });

  // Query for blogs
  const blogsQuery = useQuery<BlogsResponse>({
    queryKey: ['/api/admin/blogs'],
    enabled: selectedTab === "generate" && form.watch('articleType') === "blog"
  });
  
  // Initialize form defaults when data is loaded
  useEffect(() => {
    // First, ensure we have articleType set to "blog"
    if (!form.getValues('articleType')) {
      form.setValue('articleType', "blog");
    }
    
    // Then set the default blog ID if blogs are loaded and no blog is selected
    if (blogsQuery.data?.blogs && 
        blogsQuery.data.blogs.length > 0 && 
        form.getValues('articleType') === "blog" && 
        !form.getValues('blogId')) {
      form.setValue('blogId', String(blogsQuery.data.blogs[0].id));
    } else if (form.getValues('articleType') === "blog" && !form.getValues('blogId')) {
      // If no blogs are loaded but we're in blog mode, set a default value
      form.setValue('blogId', "default");
    }
    
    // If we've had a blogId set but the blogs data shows it's invalid, reset to first available or default
    if (form.getValues('blogId') && blogsQuery.data?.blogs) {
      const currentBlogId = form.getValues('blogId');
      const validBlog = blogsQuery.data.blogs.find(blog => String(blog.id) === String(currentBlogId));
      
      if (!validBlog && blogsQuery.data.blogs.length > 0) {
        form.setValue('blogId', String(blogsQuery.data.blogs[0].id));
      }
    }
  }, [blogsQuery.data, form]);
  
  // Save custom categories to localStorage when they change
  useEffect(() => {
    localStorage.setItem('topshop-custom-categories', JSON.stringify(customCategories));
  }, [customCategories]);
  
  // Function to add a new custom category
  const addCustomCategory = (name: string) => {
    if (!name.trim()) return;
    
    // Create a slug-like ID from the name
    const id = name.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if this category already exists (case insensitive)
    const exists = [...predefinedCategories, ...customCategories]
      .some(cat => cat.name.toLowerCase() === name.trim().toLowerCase());
    
    if (exists) {
      toast({
        title: "Category already exists",
        description: `"${name}" is already in your category list`,
        variant: "destructive"
      });
      return;
    }
    
    // Add the new category
    setCustomCategories(prev => [...prev, { id, name: name.trim() }]);
    
    toast({
      title: "Category added",
      description: `"${name}" added to your categories`,
      variant: "default"
    });
  };

  // Query for connection status
  const servicesStatusQuery = useQuery<ServiceStatusResponse>({
    queryKey: ['/api/admin/test-connections'],
    enabled: selectedTab === "connections"
  });

  // Handle image search using Pexels API
  const handleImageSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      toast({
        title: "Search query required",
        description: "Please enter a search term to find images",
        variant: "destructive"
      });
      return;
    }
    
    // Check if we already have this search in history
    const existingSearch = imageSearchHistory.find(hist => hist.query === trimmedQuery);
    if (existingSearch) {
      setSearchedImages(existingSearch.images);
      
      // If no primary images are set, automatically use the first image from history as featured
      if (primaryImages.length === 0 && existingSearch.images.length > 0) {
        setPrimaryImages([existingSearch.images[0]]);
        toast({
          title: "Featured image set",
          description: "A search result has been automatically set as your featured image",
        });
      }
      
      setImageSearchQuery(trimmedQuery);
      return;
    }
    
    setIsSearchingImages(true);
    
    try {
      const response = await apiRequest({
        url: '/api/admin/generate-images',
        method: 'POST',
        data: {
          query: trimmedQuery, // Use "query" instead of "prompt" to match server expectations
          count: 10 // Request 10 images to choose from
        }
      });
      
      if (response.success && response.images && response.images.length > 0) {
        // Mark images as selected if they're already in selectedImages
        const newImages = response.images.map((img: any) => ({
          ...img,
          selected: selectedImages.some(selected => selected.id === img.id)
        }));
        
        setSearchedImages(newImages);
        
        // Set Pexels images as default for primary images
        if (primaryImages.length === 0 && newImages.length > 0) {
          // Find an image with people if possible (better for featured images)
          const humanImage = newImages.find(img => 
            img.alt?.toLowerCase().includes('person') || 
            img.alt?.toLowerCase().includes('people') || 
            img.alt?.toLowerCase().includes('woman') || 
            img.alt?.toLowerCase().includes('man')
          );
          
          // Use human image if found, otherwise first image
          const featuredImage = humanImage || newImages[0];
          
          setPrimaryImages([featuredImage]);
          toast({
            title: "Featured image set",
            description: "A Pexels image has been automatically set as your featured image",
          });
        }
        
        // Add to search history
        setImageSearchHistory(prev => [
          ...prev,
          { 
            query: trimmedQuery, 
            images: newImages 
          }
        ]);
        
        toast({
          title: "Images found",
          description: `Found ${newImages.length} images for "${trimmedQuery}"`,
          variant: "default"
        });
      } else {
        toast({
          title: "No images found",
          description: "Try a different search term",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Image search error:", error);
      toast({
        title: "Error searching images",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSearchingImages(false);
    }
  };
  
  // Toggle image selection
  const toggleImageSelection = (imageId: string) => {
    // Get the current selection state
    const currentImage = searchedImages.find(img => img.id === imageId);
    const newSelectedState = !(currentImage?.selected || false);
    
    // Update in current search results
    setSearchedImages(prev => 
      prev.map(img => 
        img.id === imageId 
          ? { ...img, selected: newSelectedState } 
          : img
      )
    );
    
    // Update in search history
    setImageSearchHistory(prev => 
      prev.map(history => ({
        ...history,
        images: history.images.map(img => 
          img.id === imageId 
            ? { ...img, selected: newSelectedState } 
            : img
        )
      }))
    );
    
    // Update selected images list
    if (newSelectedState) {
      // Add to selected images if not already there
      const imageToAdd = searchedImages.find(img => img.id === imageId);
      if (imageToAdd && !selectedImages.some(img => img.id === imageId)) {
        setSelectedImages(prev => [...prev, { ...imageToAdd, selected: true }]);
      }
    } else {
      // Remove from selected images
      setSelectedImages(prev => prev.filter(img => img.id !== imageId));
    }
  };
  
  // Just open the dialog without auto-populating or auto-searching
  useEffect(() => {
    // No longer auto-populate or search based on title
    if (showImageDialog && imageSearchHistory.length === 0 && !searchedImages.length) {
      // Just display empty search - user must enter their own query
      setImageSearchQuery('');
    }
  }, [showImageDialog, imageSearchHistory.length, searchedImages.length]);

  // Handle image selection confirmation
  const confirmImageSelection = () => {
    // Consolidate all selected images from all searches
    const allSelected: PexelsImage[] = [];
    
    // Get selected images from current search
    const currentSelected = searchedImages.filter(img => img.selected);
    
    // Get selected images from history
    imageSearchHistory.forEach(history => {
      const historySelected = history.images.filter(img => img.selected);
      historySelected.forEach(img => {
        // Only add if not already in the list
        if (!allSelected.some(selected => selected.id === img.id)) {
          allSelected.push(img);
        }
      });
    });
    
    // Add current selected images if not in history
    currentSelected.forEach(img => {
      if (!allSelected.some(selected => selected.id === img.id)) {
        allSelected.push(img);
      }
    });
    
    setSelectedImages(allSelected);
    setShowImageDialog(false);
    
    toast({
      title: `${allSelected.length} image(s) selected`,
      description: "Images will be included in your content",
      variant: "default"
    });
  };
  
  // Handle keyword selection
  const handleKeywordsSelected = (keywords: any[]) => {
    setSelectedKeywords(keywords);
    setShowKeywordSelector(false);
    
    // Update form with selected keywords
    const keywordStrings = keywords.map(k => k.keyword);
    form.setValue('keywords', keywordStrings);
    
    toast({
      title: `${keywords.length} keyword(s) selected`,
      description: "Keywords will be used to optimize your content",
      variant: "default"
    });
    
    // Move to title selection step
    setWorkflowStep('title');
    setShowTitleSelector(true);
  };
  
  // Handle title selection
  const handleTitleSelected = (title: string) => {
    form.setValue('title', title);
    setShowTitleSelector(false);
    
    toast({
      title: "Title selected",
      description: "Title will be used for your content",
      variant: "default"
    });
    
    // Move to media selection step
    setWorkflowStep('media');
  };
  
  // Handle media selection step completion
  const handleMediaSelectionComplete = (mediaContent: {
    primaryImage: MediaImage | null;
    secondaryImages: MediaImage[];
    youtubeEmbed: string | null;
  }) => {
    console.log('Media selection completed:', mediaContent);
    setSelectedMediaContent(mediaContent);
    
    // Store the media content in form state for API submission
    if (mediaContent.primaryImage) {
      form.setValue('featuredImage', mediaContent.primaryImage.url);
    }
    
    // Store secondary images for content generation - map to compatible format
    setSecondaryImages(mediaContent.secondaryImages.map(img => ({
      id: img.id,
      url: img.url,
      width: img.width || 0,
      height: img.height || 0,
      alt: img.alt || '',
      source: img.source || 'pexels',
      selected: true,
      type: 'image' as const,
      src: {
        original: img.url,
        large: img.url,
        medium: img.url,
        small: img.url,
        thumbnail: img.url
      }
    })));
    
    // Move to content generation step
    setWorkflowStep('content');
    
    toast({
      title: "Media Selection Complete",
      description: `Selected ${mediaContent.primaryImage ? "a primary image" : "no primary image"}, ${mediaContent.secondaryImages.length} secondary images${mediaContent.youtubeEmbed ? ", and 1 video" : ""}.`
    });
  };
  
  // Handle media selection back button
  const handleMediaSelectionBack = () => {
    // Go back to title selection
    setWorkflowStep('title');
    setShowTitleSelector(true);
  };
  
  // Handle product selection
  const handleProductsSelected = (productIds: string[]) => {
    // Save the actual product objects instead of just IDs
    const selectedProductObjects: Product[] = [];
    
    productIds.forEach(id => {
      const product = productsQuery.data?.products.find(p => p.id === id);
      if (product) {
        selectedProductObjects.push(product);
      }
    });
    
    setSelectedProducts(selectedProductObjects);
    
    // Find the primary selected product to use for keyword generation and image suggestions
    if (productIds.length > 0 && selectedProductObjects.length > 0) {
      const primaryProduct = selectedProductObjects[0];
      setProductTitle(primaryProduct.title);
      setProductId(primaryProduct.id);
      
      // Set product description if available
      if (primaryProduct.body_html) {
        // Strip HTML tags for plain text description
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = primaryProduct.body_html;
        setProductDescription(tempDiv.textContent || tempDiv.innerText || '');
      } else {
        setProductDescription('');
      }
    } else {
      // Clear product-related fields if no products selected
      setProductTitle('');
      setProductId('');
      setProductDescription('');
    }
    
    // Update form value with the IDs
    form.setValue('productIds', productIds);
    
    // Move to related products selection step after product selection
    setWorkflowStep('related-products');
    
    toast({
      title: "Product selected",
      description: "Now select any related products you want to include in your content",
    });
  };
  
  // Handle related products continue action
  const handleRelatedProductsContinue = () => {
    // Move to related collections step after related products selection
    setWorkflowStep('related-collections');
    
    toast({
      title: "Related products saved",
      description: "Now select collections to include in your content",
    });
  };
  
  // Handle related collections continue action
  const handleRelatedCollectionsContinue = () => {
    // Move to buying avatars step after collections selection
    setWorkflowStep('buying-avatars');
    
    toast({
      title: "Related collections saved",
      description: "Now let's select your target buyer personas",
    });
  };
  
  // Handle buying avatars continue action
  const handleBuyerPersonasContinue = () => {
    // Store the selected buyer personas for later use in form submission
    // We'll include them in the API request when generating content
    // This avoids TypeScript errors with the form field that doesn't expect this property
    
    // Move to keyword selection step after buyer personas selection
    setWorkflowStep('keyword');
    
    toast({
      title: `${selectedBuyerPersonas.length} buyer personas saved`,
      description: selectedBuyerPersonas.length > 0 
        ? "Content will be tailored to your selected audience segments" 
        : "Using automatic audience detection",
    });
  };
  
  // Handle back button from collections to products
  const handleBackToProducts = () => {
    setWorkflowStep('related-products');
  };
  
  // Handle collection selection
  const handleCollectionsSelected = (collectionIds: string[]) => {
    // Save the actual collection objects instead of just IDs
    const selectedCollectionObjects: Collection[] = [];
    
    collectionIds.forEach(id => {
      const collection = collectionsQuery.data?.collections.find(c => c.id === id);
      if (collection) {
        selectedCollectionObjects.push(collection);
      }
    });
    
    setSelectedCollections(selectedCollectionObjects);
    
    // Update form value with IDs
    form.setValue('collectionIds', collectionIds);
    
    // Only move to next step if no products were selected (products take precedence)
    const productIds = form.getValues('productIds') || [];
    if (productIds.length === 0 && collectionIds.length > 0) {
      // Just update the workflow step, don't auto-open keyword selector
      setWorkflowStep('keyword');
      // The user will need to click the button manually
    }
  };
  
  // Handle publication actions
  const handlePublishContent = async (publicationType: 'publish' | 'draft' | 'schedule') => {
    if (!generatedContent) {
      toast({
        title: "No content to publish",
        description: "Please generate content first before publishing",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      const formValues = form.getValues();
      const publishData = {
        title: generatedContent.title,
        content: generatedContent.content,
        metaTitle: generatedContent.metaTitle,
        metaDescription: generatedContent.metaDescription,
        tags: Array.isArray(generatedContent.tags) 
          ? generatedContent.tags.join(', ') 
          : generatedContent.tags || '',
        featuredImage: generatedContent.featuredImage?.url || generatedContent.featuredImage || '',
        articleType: formValues.articleType,
        blogId: formValues.blogId,
        publicationType,
        status: publicationType === 'publish' ? 'published' : publicationType === 'schedule' ? 'scheduled' : 'draft',
        scheduledPublishDate: publicationType === 'schedule' ? formValues.scheduledPublishDate : undefined,
        scheduledPublishTime: publicationType === 'schedule' ? formValues.scheduledPublishTime || "09:30" : undefined
      };

      console.log("Publishing content with data:", publishData);

      const response = await apiRequest({
        url: '/api/posts',
        method: 'POST',
        data: publishData
      });

      if (response?.post) {
        // Check if content was successfully published to Shopify
        const isPublishedToShopify = response.post.shopifyPostId && publicationType === 'publish';
        
        setGeneratedContent({
          ...generatedContent,
          contentUrl: response.contentUrl,
          isPublished: isPublishedToShopify
        });

        const actionText = publicationType === 'publish' ? 'published' : 
                          publicationType === 'schedule' ? 'scheduled' : 'saved as draft';
        
        let description = `Your content has been ${actionText} successfully`;
        if (isPublishedToShopify) {
          description = `Your content has been published to Shopify successfully (Article ID: ${response.post.shopifyPostId})`;
        }
        
        toast({
          title: `Content ${actionText}`,
          description: description,
          variant: "default"
        });
        
        // Update generated content with Shopify information if published
        if (isPublishedToShopify) {
          setGeneratedContent(prev => prev ? {
            ...prev,
            shopifyPostId: response.post.shopifyPostId,
            shopifyBlogId: response.post.shopifyBlogId,
            shopifyUrl: response.shopifyUrl || response.post.shopifyUrl // Use handle-based URL from API
          } : null);
        }
      } else {
        throw new Error(response?.message || "Failed to process content");
      }
    } catch (error: any) {
      console.error("Publication error:", error);
      toast({
        title: "Publication failed",
        description: error?.message || "Failed to publish content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle content generation form submission
  const handleSubmit = async (values: ContentFormValues) => {
    try {
      console.log("Form submission started with values:", values);
      setIsGenerating(true);
      setGeneratedContent(null);
      
      // Validate required fields
      if (!values.title) {
        throw new Error("Please select a title for your content");
      }
      
      if (!values.articleType) {
        throw new Error("Please select an article type");
      }
      
      if (values.articleType === "blog" && !values.blogId) {
        throw new Error("Please select a blog for your content");
      }
      
      if (!Array.isArray(selectedKeywords) || selectedKeywords.length === 0) {
        throw new Error("Please select at least one keyword for SEO optimization");
      }
      
      if (workflowStep !== 'content') {
        console.warn("Attempting to generate content when not in content step. Current step:", workflowStep);
        setWorkflowStep('content');
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure state update
      }
      
      // Determine publication type based on scheduling checkbox
      let publicationType = values.postStatus === "publish" ? "publish" : "draft";
      let scheduleDate: string | undefined = undefined;
      let scheduleTime: string | undefined = undefined;
      
      // Handle scheduling information
      if (values.scheduledPublishDate) {
        // If scheduled, override publication type to schedule and set status to scheduled
        publicationType = "schedule";
        scheduleDate = values.scheduledPublishDate;
        scheduleTime = values.scheduledPublishTime || "09:30";
        
        // Updating both for maximum compatibility with backend
        console.log("Content will be scheduled for", scheduleDate, "at", scheduleTime);
        
        // Add explicit debugging log to confirm scheduling is being set
        console.log("SCHEDULING MODE ACTIVE in AdminPanel form submission", {
          scheduledPublishDate: values.scheduledPublishDate,
          scheduledPublishTime: values.scheduledPublishTime || "09:30",
          publicationType,
          scheduleDate,
          scheduleTime
        });
      }
      
      // Create a safe copy of the form values with guaranteed array values
      const processedData = {
        ...values,
        // Ensure these are always arrays of strings
        productIds: Array.isArray(values.productIds) 
          ? values.productIds.map(id => String(id)) 
          : [],
        collectionIds: Array.isArray(values.collectionIds) 
          ? values.collectionIds.map(id => String(id)) 
          : [],
        keywords: Array.isArray(values.keywords) ? values.keywords : [],
        // Ensure categories are properly included
        categories: Array.isArray(values.categories) ? values.categories : [],
        // Include selected buyer personas to target specific customer types
        buyerPersonas: selectedBuyerPersonas || [],
        // Ensure we have these required fields
        articleType: values.articleType || "blog",
        title: values.title || "",
        introType: values.introType || "search_intent",
        region: values.region || "us",
        // Make sure blogId is a string if it exists
        blogId: values.blogId ? String(values.blogId) : undefined,
        
        // Critical scheduling fields - includes multiple formats for compatibility
        // with different parts of the backend
        publicationType,
        status: publicationType === "schedule" ? "scheduled" : (values.postStatus || "draft"),
        scheduleDate,
        scheduleTime,
        // Use empty string instead of null to avoid validation errors
        scheduledPublishDate: values.scheduledPublishDate || "",
        scheduledPublishTime: values.scheduledPublishTime || (values.scheduledPublishDate ? "09:30" : ""),
        
        // If we're scheduling, keep post as draft until scheduled time
        postStatus: publicationType === "schedule" ? "scheduled" : values.postStatus,
        
        // Include content generation option fields
        articleLength: values.articleLength || "long",
        headingsCount: values.headingsCount || "3"
      };
      
      // Extra verification to ensure scheduling works correctly
      if (values.scheduledPublishDate) {
        console.log("Double-checking scheduling data is complete", {
          status: processedData.status,
          postStatus: processedData.postStatus,
          publicationType: processedData.publicationType,
          scheduleDate: processedData.scheduleDate,
          scheduleTime: processedData.scheduleTime,
          scheduledPublishDate: processedData.scheduledPublishDate,
          scheduledPublishTime: processedData.scheduledPublishTime
        });
      }
      
      // Process keywords to ensure they're in the right format
      const processedKeywords = Array.isArray(selectedKeywords)
        ? selectedKeywords.map(kw => ({
            keyword: typeof kw.keyword === 'string' ? kw.keyword : String(kw.keyword || ''),
            searchVolume: typeof kw.searchVolume === 'number' ? kw.searchVolume : 0,
            // Ensure any other properties are included but properly typed
            difficulty: typeof kw.difficulty === 'number' ? kw.difficulty : 0,
            cpc: typeof kw.cpc === 'number' ? kw.cpc : 0
          }))
        : [];
      
      // Add selected image IDs and keywords to form data
      const submitData = {
        ...processedData,
        selectedImageIds: selectedImages.map(img => String(img.id)),
        // Include full keyword data (not just strings) for analysis on the server
        selectedKeywordData: processedKeywords,
        // Add content style selection if available
        contentStyleToneId: selectedContentToneId || "",
        contentStyleDisplayName: selectedContentDisplayName || "",
        // Add selected media from selectedMediaContent state (the correct source)
        primaryImage: selectedMediaContent.primaryImage,
        secondaryImages: selectedMediaContent.secondaryImages || [],
        youtubeEmbed: selectedMediaContent.youtubeEmbed
      };
      
      console.log("Preparing API request to /api/admin/generate-content with data:", submitData);
      console.log("Selected media content state:", selectedMediaContent);
      console.log("Primary image in submit data:", submitData.primaryImage);
      console.log("Secondary images in submit data:", submitData.secondaryImages);
      console.log("YouTube embed in submit data:", submitData.youtubeEmbed);
      console.log("Media data being sent to server - Primary:", !!submitData.primaryImage, "Secondary:", submitData.secondaryImages?.length || 0, "YouTube:", !!submitData.youtubeEmbed);
      
      // Specific try-catch for the API request
      try {
        const response = await apiRequest({
          url: '/api/admin/generate-content',
          method: 'POST',
          data: submitData
        });
        
        console.log("API response received:", response);
        
        if (!response) {
          throw new Error("Received empty response from server");
        }
        
        // Store the API response with proper URL mapping for frontend access
        setGeneratedContent({
          ...response,
          contentUrl: response.contentUrl,
          shopifyUrl: response.contentUrl // Map contentUrl to shopifyUrl for button compatibility
        });
        
        // Force content editor to re-render with new content
        setContentEditorKey(prev => prev + 1);
        
        toast({
          title: "Content generated successfully",
          description: "Your content has been generated and is ready for review in the Content Preview section.",
          variant: "default"
        });
      } catch (apiError: any) {
        console.error("API request failed:", apiError);
        toast({
          title: "API Request Failed",
          description: apiError?.message || "Could not connect to the server. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Content generation error:", error);
      toast({
        title: "Error generating content",
        description: error?.message || "An unexpected error occurred. Please check your form inputs and try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-10">
      {/* Show scheduling permission notice if needed */}
      {permissionsData?.success && !permissionsData.hasPermission && (
        <div className="mb-4">
          <SchedulingPermissionNotice 
            storeName={permissionsData.store?.name || 'your store'} 
          />
        </div>
      )}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-800 text-transparent bg-clip-text mb-2">
            TopShop SEO Admin
          </h1>
          <p className="text-muted-foreground">
            Manage content generation, view service status, and configure settings
          </p>
        </div>

      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="generate">Content Generator</TabsTrigger>
          <TabsTrigger value="connections">Services</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Content Generation Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Content Generator</CardTitle>
                <CardDescription>
                  Generate SEO-optimized content for your Shopify store
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
                    {/* Step guidance */}
                    {/* Top button for Load Template */}
                    <div className="flex justify-end mb-4">
                      <Button
                        type="button" 
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLoadTemplateDialog(true)}
                        disabled={templates.length === 0}
                        className="flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        Load Template
                      </Button>
                    </div>
                    
                    <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                      <h3 className="font-medium text-blue-700 mb-2">Content Creation Workflow</h3>
                      <div className="flex items-center space-x-3">
                        {/* Step 1: Product Selection */}
                        <Badge className={workflowStep === 'product' ? 'bg-blue-600' : 'bg-gray-300'}>1</Badge>
                        <div className="flex-1 h-1 bg-gray-200 rounded">
                          <div className={`h-1 bg-blue-600 rounded ${workflowStep !== 'product' ? 'w-full' : 'w-0'}`}></div>
                        </div>
                        
                        {/* Step 2: Related Products */}
                        <Badge className={workflowStep === 'related-products' ? 'bg-blue-600' : (workflowStep === 'related-collections' || workflowStep === 'keyword' || workflowStep === 'title' || workflowStep === 'content' ? 'bg-green-600' : 'bg-gray-300')}>2</Badge>
                        <div className="flex-1 h-1 bg-gray-200 rounded">
                          <div className={`h-1 bg-blue-600 rounded ${workflowStep === 'related-collections' || workflowStep === 'keyword' || workflowStep === 'title' || workflowStep === 'content' ? 'w-full' : 'w-0'}`}></div>
                        </div>
                        
                        {/* Step 3: Related Collections */}
                        <Badge className={workflowStep === 'related-collections' ? 'bg-blue-600' : (workflowStep === 'keyword' || workflowStep === 'title' || workflowStep === 'content' ? 'bg-green-600' : 'bg-gray-300')}>3</Badge>
                        <div className="flex-1 h-1 bg-gray-200 rounded">
                          <div className={`h-1 bg-blue-600 rounded ${workflowStep === 'keyword' || workflowStep === 'title' || workflowStep === 'content' ? 'w-full' : 'w-0'}`}></div>
                        </div>
                        
                        {/* Step 4: Keywords */}
                        <Badge className={workflowStep === 'keyword' ? 'bg-blue-600' : (workflowStep === 'title' || workflowStep === 'content' ? 'bg-green-600' : 'bg-gray-300')}>4</Badge>
                        <div className="flex-1 h-1 bg-gray-200 rounded">
                          <div className={`h-1 bg-blue-600 rounded ${workflowStep === 'title' || workflowStep === 'content' ? 'w-full' : 'w-0'}`}></div>
                        </div>
                        
                        {/* Step 5: Title */}
                        <Badge className={workflowStep === 'title' ? 'bg-blue-600' : (workflowStep === 'content' ? 'bg-green-600' : 'bg-gray-300')}>5</Badge>
                        <div className="flex-1 h-1 bg-gray-200 rounded">
                          <div className={`h-1 bg-blue-600 rounded ${workflowStep === 'content' ? 'w-full' : 'w-0'}`}></div>
                        </div>
                        
                        {/* Step 6: Content */}
                        <Badge className={workflowStep === 'content' ? 'bg-blue-600' : 'bg-gray-300'}>6</Badge>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-600">
                        <span>Main Product</span>
                        <span>Related Products</span>
                        <span>Collections</span>
                        <span>Keywords</span>
                        <span>Title</span>
                        <span>Generate</span>
                      </div>
                    </div>
                      
                    {/* Basic information section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Basic Information</h3>

                      {/* Region selection - always visible regardless of step */}
                      <FormField
                        control={form.control}
                        name="region"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value || "us"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select region" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No specific region</SelectItem>
                                {regionsQuery.data?.regions.map((region: Region) => (
                                  <SelectItem key={region.id} value={region.id}>
                                    {region.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Target region for content localization
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Content type selection - always visible regardless of step */}
                      <FormField
                        control={form.control}
                        name="articleType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content Type</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Immediately update the form to show/hide the blog selection
                                if (value === "blog" || value === "page") {
                                  form.setValue('articleType', value);
                                }
                              }} 
                              value={field.value || "blog"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select content type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="blog">Blog Post</SelectItem>
                                <SelectItem value="page">Shopify Page</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Blog ID selection if blog type is selected */}
                      {form.watch('articleType') === "blog" && (
                        <FormField
                          control={form.control}
                          name="blogId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Selected Blog</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  console.log("Blog changed to:", value);
                                  // Update both the field and form state to ensure consistent updates
                                  field.onChange(value);
                                  // Force update the form with setValue to ensure React picks up the change
                                  form.setValue('blogId', value, { 
                                    shouldValidate: true,
                                    shouldDirty: true,
                                    shouldTouch: true
                                  });
                                  
                                  // Force a re-render since the select value might not update immediately
                                  setTimeout(() => {
                                    const formState = form.getValues();
                                    console.log("Current form state:", formState);
                                    // Force a re-render to update UI
                                    setForceUpdate(prev => prev + 1);
                                  }, 100);
                                }} 
                                key={`blog-select-${field.value ? String(field.value) : "default"}-${forceUpdate}`}
                                value={field.value ? String(field.value) : ""} // Convert to string to fix type issues
                                defaultValue=""
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full border border-gray-300">
                                    {/* We use a direct component to ensure it re-renders on selection change */}
                                    {(() => {
                                      // Get blog title from the current value
                                      const currentBlogId = field.value;
                                      
                                      if (blogsQuery.isLoading) {
                                        return <SelectValue placeholder="Loading blogs..." />;
                                      }
                                      
                                      // If no blogs are loaded, use a default value
                                      if (!blogsQuery.data?.blogs || blogsQuery.data.blogs.length === 0) {
                                        return <SelectValue placeholder="Default Blog" />;
                                      }
                                      
                                      // Find the selected blog by ID (convert to string for comparison)
                                      const selectedBlog = blogsQuery.data.blogs.find(
                                        blog => String(blog.id) === String(currentBlogId)
                                      );
                                      
                                      // Get blog title to display
                                      const displayTitle = selectedBlog?.title || blogsQuery.data.blogs[0]?.title || "News";
                                      
                                      return <SelectValue placeholder={displayTitle}>{displayTitle}</SelectValue>;
                                    })()}
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {blogsQuery.isLoading ? (
                                    <SelectItem value="loading" disabled>Loading blogs...</SelectItem>
                                  ) : blogsQuery.data?.blogs && blogsQuery.data.blogs.length > 0 ? (
                                    blogsQuery.data.blogs.map((blog: Blog) => (
                                      <SelectItem key={blog.id} value={String(blog.id)}>
                                        {blog.title}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="default">Default Blog</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormDescription className="sr-only">
                                Select the blog where this post will be published
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      {/* Selected Items Display - appears after blog selection */}
                      {(selectedProducts.length > 0 || selectedCollections.length > 0 || selectedBuyerPersonas.length > 0 || selectedKeywords.length > 0 || form.watch('title')) && (
                        <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                          <h4 className="text-sm font-medium text-slate-700 mb-3">Current Selections</h4>
                          
                          {/* Selected Products */}
                          {selectedProducts.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <h5 className="text-sm font-medium flex items-center">
                                  <Package className="h-4 w-4 mr-2 text-green-500" />
                                  Selected Products ({selectedProducts.length})
                                </h5>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {selectedProducts.map((product) => (
                                  <div key={product.id} className="flex items-center gap-2 bg-white rounded-md p-2 shadow-sm border">
                                    {product.image && (
                                      <img 
                                        src={product.image} 
                                        alt={product.title} 
                                        className="w-8 h-8 rounded object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <span className="text-sm font-medium truncate max-w-32">{product.title}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 rounded-full ml-1 hover:bg-slate-100"
                                      onClick={() => {
                                        setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Selected Collections */}
                          {selectedCollections.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <h5 className="text-sm font-medium flex items-center">
                                  <Folders className="h-4 w-4 mr-2 text-purple-500" />
                                  Selected Collections ({selectedCollections.length})
                                </h5>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {selectedCollections.map((collection) => (
                                  <div key={collection.id} className="flex items-center gap-2 bg-white rounded-md p-2 shadow-sm border">
                                    <FolderOpen className="h-4 w-4 text-purple-500" />
                                    <span className="text-sm font-medium truncate max-w-32">{collection.title}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 rounded-full ml-1 hover:bg-slate-100"
                                      onClick={() => {
                                        setSelectedCollections(prev => prev.filter(c => c.id !== collection.id));
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Selected Buyer Personas */}
                          {selectedBuyerPersonas.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <h5 className="text-sm font-medium flex items-center">
                                  <Users className="h-4 w-4 mr-2 text-blue-500" />
                                  Selected Buyer Personas ({selectedBuyerPersonas.length})
                                </h5>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {selectedBuyerPersonas.map((personaId) => {
                                  const persona = predefinedBuyerPersonas.find(p => p.id === personaId);
                                  if (!persona) return null;
                                  
                                  let IconComponent = User;
                                  if (persona.icon === 'piggy-bank') IconComponent = PiggyBank;
                                  else if (persona.icon === 'gem') IconComponent = Gem;
                                  else if (persona.icon === 'zap') IconComponent = Zap;
                                  else if (persona.icon === 'leaf') IconComponent = Leaf;
                                  else if (persona.icon === 'cpu') IconComponent = Cpu;
                                  else if (persona.icon === 'search') IconComponent = Search;
                                  else if (persona.icon === 'heart') IconComponent = Heart;
                                  else if (persona.icon === 'users') IconComponent = Users;
                                  
                                  return (
                                    <div key={persona.id} className="flex items-center gap-2 bg-white rounded-md p-2 shadow-sm border">
                                      <div className="h-5 w-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <IconComponent className="h-3 w-3" />
                                      </div>
                                      <span className="text-sm font-medium truncate max-w-32">{persona.name}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 rounded-full ml-1 hover:bg-slate-100"
                                        onClick={() => {
                                          setSelectedBuyerPersonas(prev => prev.filter(id => id !== persona.id));
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Selected Keywords */}
                          {selectedKeywords.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <h5 className="text-sm font-medium flex items-center">
                                  <Search className="h-4 w-4 mr-2 text-orange-500" />
                                  Selected Keywords ({selectedKeywords.length})
                                </h5>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {selectedKeywords.map((keyword, index) => (
                                  <div key={index} className="flex items-center gap-2 bg-white rounded-md p-2 shadow-sm border">
                                    <span className="text-sm font-medium">{typeof keyword === 'string' ? keyword : keyword.keyword}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 rounded-full ml-1 hover:bg-slate-100"
                                      onClick={() => {
                                        setSelectedKeywords(prev => prev.filter((_, i) => i !== index));
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Selected Title */}
                          {form.watch('title') && (
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <h5 className="text-sm font-medium flex items-center">
                                  <Type className="h-4 w-4 mr-2 text-indigo-500" />
                                  Selected Title
                                </h5>
                              </div>
                              <div className="bg-white rounded-md p-3 shadow-sm border">
                                <p className="text-sm font-medium">{form.watch('title')}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Title field (hidden initially, made visible and populated in title step) */}
                      <div className={workflowStep === 'content' ? 'block' : 'hidden'}>
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Selected Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter a descriptive title" {...field} />
                              </FormControl>
                              <FormMessage />
                              <div className="mt-2">
                                <Button
                                  type="button" 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowTitleSelector(true)}
                                >
                                  Change Title
                                </Button>
                              </div>
                            </FormItem>
                          )}
                        />

                      </div>
                      
                      {/* Step 1: Product and Collection Selection */}
                      <div className={workflowStep === 'product' ? 'block' : 'hidden'}>
                        <div className="p-4 bg-blue-50 rounded-md mb-4">
                          <h4 className="font-medium text-blue-700 mb-1">Step 1: Select Products or Collections</h4>
                          <p className="text-sm text-blue-600">Choose products or collections to feature in your content</p>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="productIds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Featured Products</FormLabel>
                              <FormControl>
                                <ProductMultiSelect
                                  options={productsQuery.data?.products.map(product => ({
                                    product: product,
                                    value: product.id
                                  })) || []}
                                  selected={Array.isArray(field.value) ? field.value : []}
                                  onChange={(selected) => {
                                    field.onChange(selected);
                                    handleProductsSelected(selected);
                                  }}
                                  placeholder="Select products to feature in content..."
                                />
                              </FormControl>
                              
                              <FormDescription>
                                Products will be mentioned and linked in your content
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="collectionIds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Featured Collections</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={collectionsQuery.data?.collections.map(collection => ({
                                    label: collection.title,
                                    value: collection.id
                                  })) || []}
                                  selected={Array.isArray(field.value) ? field.value : []}
                                  onChange={(selected) => {
                                    field.onChange(selected);
                                    handleCollectionsSelected(selected);
                                  }}
                                  placeholder="Select collections to feature in content..."
                                />
                              </FormControl>
                              
                              {/* Display selected collections more prominently */}
                              {selectedCollections.length > 0 && (
                                <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
                                  <h4 className="font-medium text-sm text-green-700 mb-2">Selected Collections:</h4>
                                  <div className="space-y-2">
                                    {selectedCollections.map(collection => (
                                      <div key={collection.id} className="flex items-center gap-2 p-2 bg-white rounded-md shadow-sm">
                                        {collection.image ? (
                                          <img 
                                            src={collection.image} 
                                            alt={collection.title} 
                                            className="w-10 h-10 object-contain rounded border border-gray-200" 
                                          />
                                        ) : (
                                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                            <Package className="h-5 w-5 text-gray-400" />
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-800 truncate">{collection.title}</p>
                                          <p className="text-xs text-gray-500 truncate">Category</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <FormDescription>
                                Collections will be mentioned and linked in your content
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="mt-4 flex justify-end">
                          <Button
                            type="button"
                            onClick={() => {
                              if (selectedProducts.length > 0) {
                                setWorkflowStep('related-products');
                                toast({
                                  title: "Main product selected",
                                  description: "Now select any related products you want to include in your content",
                                });
                              } else {
                                toast({
                                  title: "Selection Required",
                                  description: "Please select at least one product",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            Next: Related Products
                          </Button>
                        </div>
                      </div>
                      
                      {/* Step 2: Related Products Selection Section */}
                      <div className={workflowStep === 'related-products' ? 'block' : 'hidden'}>
                        <div className="p-4 bg-blue-50 rounded-md mb-4">
                          <h4 className="font-medium text-blue-700 mb-1">Step 2: Choose Related Products</h4>
                          <p className="text-sm text-blue-600 mb-4">
                            Select products related to your content to improve cross-selling opportunities
                          </p>
                        </div>

                        <RelatedProductsSelector
                          products={productsQuery.data?.products || []}
                          selectedProducts={selectedProducts}
                          onProductSelect={(product) => {
                            // Add the product to the selected products if not already there
                            if (!selectedProducts.some(p => p.id === product.id)) {
                              const updatedProducts = [...selectedProducts, product];
                              setSelectedProducts(updatedProducts);
                              
                              // Update form value with the IDs
                              const productIds = updatedProducts.map(p => p.id);
                              form.setValue('productIds', productIds);
                            }
                          }}
                          onProductRemove={(productId) => {
                            // Remove the product from the selected products
                            const updatedProducts = selectedProducts.filter(p => p.id !== productId);
                            setSelectedProducts(updatedProducts);
                            
                            // Update form value with the IDs
                            const productIds = updatedProducts.map(p => p.id);
                            form.setValue('productIds', productIds);
                          }}
                          onContinue={handleRelatedProductsContinue}
                        />
                      </div>
                      
                      {/* Step 3: Related Collections Selection Section */}
                      <div className={workflowStep === 'related-collections' ? 'block' : 'hidden'}>
                        <div className="p-4 bg-blue-50 rounded-md mb-4">
                          <h4 className="font-medium text-blue-700 mb-1">Step 3: Choose Related Collections</h4>
                          <p className="text-sm text-blue-600 mb-4">
                            Select collections that are related to your content to group products and categories
                          </p>
                        </div>

                        <RelatedCollectionsSelector
                          collections={collectionsQuery.data?.collections || []}
                          selectedCollections={selectedCollections}
                          onCollectionSelect={(collection) => {
                            // Add the collection to the selected collections if not already there
                            if (!selectedCollections.some(c => c.id === collection.id)) {
                              const updatedCollections = [...selectedCollections, collection];
                              setSelectedCollections(updatedCollections);
                              
                              // Update form value with the IDs
                              const collectionIds = updatedCollections.map(c => c.id);
                              form.setValue('collectionIds', collectionIds);
                            }
                          }}
                          onCollectionRemove={(collectionId) => {
                            // Remove the collection from the selected collections
                            const updatedCollections = selectedCollections.filter(c => c.id !== collectionId);
                            setSelectedCollections(updatedCollections);
                            
                            // Update form value with the IDs
                            const collectionIds = updatedCollections.map(c => c.id);
                            form.setValue('collectionIds', collectionIds);
                          }}
                          onContinue={handleRelatedCollectionsContinue}
                          onBack={handleBackToProducts}
                        />
                      </div>
                      
                      {/* Step 4: Buyer Personas Selection Section */}
                      <div className={workflowStep === 'buying-avatars' ? 'block' : 'hidden'}>
                        <div className="p-4 bg-blue-50 rounded-md mb-4">
                          <h4 className="font-medium text-blue-700 mb-1">Step 4: Select Target Buyer Personas</h4>
                          <p className="text-sm text-blue-600 mb-2">
                            Choose the types of customers you want to target with this content. This helps personalize the content to specific audience segments.
                          </p>
                        </div>
                        
                        {/* Buyer Personas Grid with Multi-Select */}
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-md font-medium">Buyer Personas</h3>
                            {selectedBuyerPersonas.length > 0 && (
                              <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium flex items-center">
                                <CheckSquare className="h-3.5 w-3.5 mr-1" />
                                <span>{selectedBuyerPersonas.length} selected</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {predefinedBuyerPersonas.map(persona => {
                              const isSelected = selectedBuyerPersonas.includes(persona.id);
                              
                              // Get the appropriate icon component
                              let IconComponent = User;
                              if (persona.icon === 'piggy-bank') IconComponent = PiggyBank;
                              else if (persona.icon === 'gem') IconComponent = Gem;
                              else if (persona.icon === 'zap') IconComponent = Zap;
                              else if (persona.icon === 'leaf') IconComponent = Leaf;
                              else if (persona.icon === 'cpu') IconComponent = Cpu;
                              else if (persona.icon === 'search') IconComponent = Search;
                              else if (persona.icon === 'heart') IconComponent = Heart;
                              else if (persona.icon === 'users') IconComponent = Users;
                              
                              return (
                                <div 
                                  key={persona.id}
                                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                    isSelected 
                                      ? 'bg-blue-50 border-blue-300 shadow-sm' 
                                      : 'bg-white hover:bg-gray-50 border-gray-200'
                                  }`}
                                  onClick={() => {
                                    setSelectedBuyerPersonas(prev => {
                                      if (prev.includes(persona.id)) {
                                        return prev.filter(id => id !== persona.id);
                                      } else {
                                        return [...prev, persona.id];
                                      }
                                    });
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                                      isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      <IconComponent className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between">
                                        <h4 className="font-medium text-gray-900 text-sm">{persona.name}</h4>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                          isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                                        }`}>
                                          {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">{persona.description}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="mt-6 flex justify-between">
                          <Button 
                            variant="outline" 
                            type="button"
                            onClick={() => setWorkflowStep('related-collections')}
                          >
                            <ChevronLeft className="mr-2 h-4 w-4" /> Back
                          </Button>
                          <Button 
                            type="button"
                            onClick={handleBuyerPersonasContinue}
                          >
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Step 5: Keyword Selection Section */}
                      <div className={workflowStep === 'keyword' ? 'block' : 'hidden'}>
                        <div className="p-4 bg-blue-50 rounded-md mb-4">
                          <h4 className="font-medium text-blue-700 mb-1">Step 5: Choose Keywords</h4>
                          <p className="text-sm text-blue-600 mb-2">
                            Click the button below to select keywords for your content. The following selected items will be used for keyword generation:
                          </p>
                          
                          {/* Display selected products and collections in the keyword step */}
                          {(selectedProducts.length > 0 || selectedCollections.length > 0) && (
                            <div className="mb-4 p-3 bg-white rounded-md border">
                              {selectedProducts.length > 0 && (
                                <div className="mb-2">
                                  <h5 className="text-xs font-medium text-slate-600 mb-1.5">Selected Products:</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedProducts.map(product => {
                                      // Get image source from images array or direct image property
                                      const imageSrc = product.images && product.images.length > 0
                                        ? product.images[0].src
                                        : product.image || '';
                                      
                                      return (
                                        <div key={product.id} className="flex items-center gap-2 bg-slate-50 rounded p-1.5 border shadow-sm">
                                          {imageSrc ? (
                                            <img 
                                              src={imageSrc} 
                                              alt={product.title}
                                              className="w-8 h-8 rounded object-contain" 
                                            />
                                          ) : (
                                            <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                                              <Search className="w-4 h-4 text-slate-400" />
                                            </div>
                                          )}
                                          <span className="text-xs font-medium max-w-[120px] truncate">{product.title}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {selectedCollections.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-medium text-slate-600 mb-1.5">Selected Collections:</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedCollections.map(collection => (
                                      <div key={collection.id} className="flex items-center gap-2 bg-slate-50 rounded p-1.5 border shadow-sm">
                                        {collection.image_url ? (
                                          <img 
                                            src={collection.image_url} 
                                            alt={collection.title}
                                            className="w-8 h-8 rounded object-contain" 
                                          />
                                        ) : (
                                          <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                          </div>
                                        )}
                                        <span className="text-xs font-medium max-w-[120px] truncate">{collection.title}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <Button 
                            onClick={() => setShowKeywordSelector(true)}
                            size="lg"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                            <Sparkles className="mr-2 h-4 w-4" /> 
                            Select Keywords
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 min-h-[40px] border rounded-md p-2 mb-3">
                          {Array.isArray(selectedKeywords) && selectedKeywords.length > 0 ? (
                            selectedKeywords.map((keyword, idx) => (
                              <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                                {keyword?.keyword || ''}
                                {keyword?.searchVolume && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({keyword.searchVolume.toLocaleString()})
                                  </span>
                                )}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No keywords selected yet</span>
                          )}
                        </div>
                        
                        <div className="flex justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setWorkflowStep('product')}
                          >
                            Back
                          </Button>
                          
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              className="mr-2"
                              onClick={() => setShowKeywordSelector(true)}
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              {selectedKeywords.length > 0 ? 'Change Keywords' : 'Select Keywords'}
                            </Button>
                            
                            <Button
                              type="button"
                              onClick={() => {
                                if (selectedKeywords.length > 0) {
                                  setWorkflowStep('title');
                                  setShowTitleSelector(true);
                                } else {
                                  toast({
                                    title: "Keywords Required",
                                    description: "Please select at least one keyword before continuing",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              disabled={selectedKeywords.length === 0}
                            >
                              Next: Choose Title
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Step 3: Title Selection Section */}
                      <div className={workflowStep === 'title' ? 'block' : 'hidden'}>
                        <div className="p-4 bg-blue-50 rounded-md mb-4">
                          <h4 className="font-medium text-blue-700 mb-1">Step 3: Select a Title</h4>
                          <p className="text-sm text-blue-600">Choose from AI-generated title suggestions based on your keywords</p>
                        </div>
                        
                        {form.watch('title') && (
                          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                            <h4 className="font-medium">Selected Title:</h4>
                            <p className="text-lg font-semibold">{form.watch('title')}</p>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setWorkflowStep('keyword')}
                          >
                            Back
                          </Button>
                          
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              className="mr-2"
                              onClick={() => setShowTitleSelector(true)}
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              {form.watch('title') ? 'Change Title' : 'Select Title'}
                            </Button>
                            
                            <Button
                              type="button"
                              onClick={() => {
                                if (form.watch('title')) {
                                  setWorkflowStep('media');
                                } else {
                                  toast({
                                    title: "Title Required",
                                    description: "Please select a title before continuing",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              disabled={!form.watch('title')}
                            >
                              Next: Choose Media
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Step 4: Media Selection Section */}
                      <div className={workflowStep === 'media' ? 'block' : 'hidden'}>
                        <div className="p-4 bg-blue-50 rounded-md mb-4">
                          <h4 className="font-medium text-blue-700 mb-1">Step 4: Choose Media</h4>
                          <p className="text-sm text-blue-600">Select compelling visuals to enhance your content and boost engagement</p>
                        </div>
                        
                        <Tabs defaultValue="primary" className="mb-6">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="primary">Primary Images</TabsTrigger>
                            <TabsTrigger value="secondary">Secondary Images</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="primary" className="p-4 bg-slate-50 rounded-md mt-2">
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-1">Featured Image</h4>
                              <p className="text-xs text-slate-500 mb-3">
                                Use emotionally compelling images with people or animals. Try search terms like "happy woman", "confused customer", "smiling family", etc.
                              </p>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                <Card className="overflow-hidden">
                                  <CardHeader className="p-3 bg-slate-100">
                                    <CardTitle className="text-sm">Pexels Images</CardTitle>
                                    <CardDescription className="text-xs">
                                      Search free stock photos
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="p-3">
                                    <Button 
                                      variant="outline" 
                                      className="w-full" 
                                      size="sm"
                                      onClick={() => {
                                        setImageSource('pexels');
                                        setImageSearchQuery(`happy ${selectedProducts.length > 0 ? selectedProducts[0].title.split(' ')[0] : 'customer'}`);
                                        setShowImageDialog(true);
                                      }}
                                    >
                                      <Search className="mr-2 h-4 w-4" />
                                      Search Pexels
                                    </Button>
                                  </CardContent>
                                </Card>
                                
                                <Card className="overflow-hidden">
                                  <CardHeader className="p-3 bg-slate-100">
                                    <CardTitle className="text-sm">Shopify Images</CardTitle>
                                    <CardDescription className="text-xs">
                                      Use images from your store
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="p-3">
                                    <div className="flex flex-col space-y-2">
                                  
                                      
                                      {/* Only show product images button when a product is selected */}
                                      {selectedProducts.length > 0 && (
                                        <Button 
                                          variant="outline" 
                                          className="w-full" 
                                          size="sm"
                                          onClick={() => {
                                            setImageSource('product_images');
                                            if (selectedProducts[0]?.id) {
                                              fetchProductImages(selectedProducts[0].id);
                                            } else {
                                              toast({
                                                title: "No product selected",
                                                description: "Please select a product first",
                                                variant: "destructive"
                                              });
                                            }
                                            setShowImageDialog(true);
                                          }}
                                        >
                                          <ImageIcon className="mr-2 h-4 w-4" />
                                          Product Images
                                        </Button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                <Card className="overflow-hidden">
                                  <CardHeader className="p-3 bg-slate-100">
                                    <CardTitle className="text-sm">Upload Image</CardTitle>
                                    <CardDescription className="text-xs">
                                      Upload your own images
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="p-3">
                                    <Button 
                                      variant="outline" 
                                      className="w-full" 
                                      size="sm"
                                      onClick={() => {
                                        setImageSource('upload');
                                        setShowImageDialog(true);
                                      }}
                                    >
                                      <Upload className="mr-2 h-4 w-4" />
                                      Upload Image
                                    </Button>
                                  </CardContent>
                                </Card>
                              </div>
                              
                              {/* Display selected primary images */}
                              {primaryImages.length > 0 ? (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-medium">Selected Primary Images:</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {primaryImages.map((image) => (
                                      <div key={image.id} className="relative group">
                                        <ShopifyImageViewer 
                                          src={image.src?.medium || image.url} 
                                          alt={image.alt || "Primary image"} 
                                          className="w-full h-32 object-cover rounded-md border"
                                        />
                                        <div className="absolute top-2 right-2">
                                          <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="h-6 w-6 rounded-full opacity-80 hover:opacity-100"
                                            onClick={() => setPrimaryImages(prev => prev.filter(img => img.id !== image.id))}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-4 bg-white rounded-md border border-dashed">
                                  <ImageIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                                  <p className="text-sm text-slate-500">No primary images selected</p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    Select emotionally compelling images featuring people or subjects relevant to your content
                                  </p>
                                </div>
                              )}
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="secondary" className="p-4 bg-slate-50 rounded-md mt-2">
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-1">Secondary Images</h4>
                              <p className="text-xs text-slate-500 mb-3">
                                These images will appear throughout your content to showcase product details or supporting visuals.
                              </p>
                              
                              {/* Product Images Section */}
                              <div className="mb-4">
                                <h4 className="text-sm font-medium mb-2">Product Images</h4>
                                {selectedProducts.length > 0 ? (
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {selectedProducts.map((product) => {
                                      if (!product.image) return null;
                                      return (
                                        <div key={product.id} className="relative group">
                                          <div className="aspect-square overflow-hidden rounded-md border">
                                            <ShopifyImageViewer 
                                              src={product.image} 
                                              alt={product.title} 
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                            <Button
                                              type="button"
                                              variant="secondary"
                                              size="sm"
                                              className="opacity-0 group-hover:opacity-100 transition-all"
                                              onClick={() => {
                                                // Add product image to secondary images
                                                const productImage: PexelsImage = {
                                                  id: `product-${product.id}`,
                                                  url: product.image || '',
                                                  width: 500,
                                                  height: 500,
                                                  alt: product.title,
                                                  src: {
                                                    original: product.image || '',
                                                    large: product.image || '',
                                                    medium: product.image || '',
                                                    small: product.image || '',
                                                    thumbnail: product.image || '',
                                                  }
                                                };
                                                setSecondaryImages(prev => [...prev, productImage]);
                                                toast({
                                                  title: "Image added",
                                                  description: "Product image added to secondary images",
                                                });
                                              }}
                                            >
                                              <Plus className="mr-2 h-3 w-3" />
                                              Add Image
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 bg-white rounded-md border border-dashed">
                                    <Package className="h-8 w-8 mx-auto text-slate-300 mb-1" />
                                    <p className="text-sm text-slate-500">No products selected</p>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="mt-2"
                                      onClick={() => setWorkflowStep('product')}
                                    >
                                      <ArrowLeft className="mr-2 h-3 w-3" />
                                      Select Products
                                    </Button>
                                  </div>
                                )}
                              </div>
                              
                              {/* Custom Secondary Images */}
                              <div className="mt-6">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-sm font-medium">Additional Secondary Images</h4>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setImageSearchQuery('product lifestyle');
                                      setShowImageDialog(true);
                                    }}
                                  >
                                    <Search className="mr-2 h-3 w-3" />
                                    Search More Images
                                  </Button>
                                </div>
                                
                                {/* Display selected secondary images */}
                                {secondaryImages.length > 0 ? (
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {secondaryImages.map((image) => (
                                      <div key={image.id} className="relative group">
                                        <ShopifyImageViewer 
                                          src={image.src?.medium || image.url} 
                                          alt={image.alt || "Secondary image"} 
                                          className="w-full h-32 object-cover rounded-md border"
                                        />
                                        <div className="absolute top-2 right-2">
                                          <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="h-6 w-6 rounded-full opacity-80 hover:opacity-100"
                                            onClick={() => setSecondaryImages(prev => prev.filter(img => img.id !== image.id))}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 bg-white rounded-md border border-dashed">
                                    <FileImage className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                                    <p className="text-sm text-slate-500">No additional secondary images</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                      Add supporting images to enhance your content
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                        
                        <div className="flex justify-between mt-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setWorkflowStep('title')}
                          >
                            Back to Title
                          </Button>
                          
                          <Button
                            type="button"
                            onClick={() => {
                              // Continue to content generation step
                              setWorkflowStep('content');
                            }}
                          >
                            Next: Generate Content
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Style and formatting section - Only shown in content step */}
                    <div className={`space-y-4 pt-4 ${workflowStep === 'content' ? 'block' : 'hidden'}`}>
                      <h3 className="text-lg font-medium">Style & Formatting</h3>
                      
                      {/* Content Generation Options */}
                      {/* Buyer Personas Display */}
                      <div className="col-span-full mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium flex items-center">
                            <Users className="h-4 w-4 mr-2 text-blue-500" />
                            Selected Buyer Personas
                          </h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setWorkflowStep('buying-avatars')}
                            className="h-8"
                          >
                            <User className="mr-2 h-4 w-4" />
                            Edit Personas
                          </Button>
                        </div>
                        
                        <div className="border rounded-md p-3 bg-slate-50">
                          {selectedBuyerPersonas.length > 0 ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {selectedBuyerPersonas.map((personaId) => {
                                  const persona = predefinedBuyerPersonas.find(p => p.id === personaId);
                                  if (!persona) return null;
                                  
                                  // Get the appropriate icon component
                                  let IconComponent = User;
                                  if (persona.icon === 'piggy-bank') IconComponent = PiggyBank;
                                  else if (persona.icon === 'gem') IconComponent = Gem;
                                  else if (persona.icon === 'zap') IconComponent = Zap;
                                  else if (persona.icon === 'leaf') IconComponent = Leaf;
                                  else if (persona.icon === 'cpu') IconComponent = Cpu;
                                  else if (persona.icon === 'search') IconComponent = Search;
                                  else if (persona.icon === 'heart') IconComponent = Heart;
                                  else if (persona.icon === 'users') IconComponent = Users;
                                  
                                  return (
                                    <div 
                                      key={persona.id} 
                                      className="flex items-center gap-2 bg-white rounded-md p-2 shadow-sm border"
                                    >
                                      <div className="h-6 w-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <IconComponent className="h-3.5 w-3.5" />
                                      </div>
                                      <span className="text-sm font-medium">{persona.name}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 rounded-full ml-1 hover:bg-slate-100"
                                        onClick={() => {
                                          setSelectedBuyerPersonas(prev => 
                                            prev.filter(id => id !== persona.id)
                                          );
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Content will be tailored to these target audience segments
                              </p>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-muted-foreground mb-2">No buyer personas selected</p>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setWorkflowStep('buying-avatars')}
                              >
                                <Users className="mr-2 h-4 w-4" />
                                Select Target Audience
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                        
                        <FormField
                          control={form.control}
                          name="articleLength"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Article Length</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select article length" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="short">Short (~500 words)</SelectItem>
                                  <SelectItem value="medium">Medium (~800 words)</SelectItem>
                                  <SelectItem value="long">Long (~1200 words)</SelectItem>
                                  <SelectItem value="comprehensive">Comprehensive (~1800 words)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-xs">
                                Determines the detail and depth of the content
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="headingsCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Sections</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Number of H2 headings" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="2">2 Sections</SelectItem>
                                  <SelectItem value="3">3 Sections</SelectItem>
                                  <SelectItem value="4">4 Sections</SelectItem>
                                  <SelectItem value="5">5 Sections</SelectItem>
                                  <SelectItem value="6">6 Sections</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-xs">
                                Controls how many H2 headings in the article
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        
                        {/* Categories Multi-select */}
                        <FormField
                          control={form.control}
                          name="categories"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categories</FormLabel>
                              <div className="flex flex-col space-y-3">
                                <div className="flex flex-wrap gap-2 border p-2 rounded-md min-h-[38px]">
                                  {field.value && Array.isArray(field.value) && field.value.length > 0 ? (
                                    field.value.map(category => {
                                      // Find display name for this category
                                      const foundCategory = [...predefinedCategories, ...customCategories]
                                        .find(cat => cat.id === category);
                                        
                                      return (
                                        <Badge
                                          key={category}
                                          variant="secondary"
                                          className="flex items-center gap-1"
                                        >
                                          {foundCategory?.name || category}
                                          <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => {
                                              // Remove this category - ensure field.value is an array
                                              const currentCategories = Array.isArray(field.value) ? field.value : [];
                                              const updatedCategories = currentCategories.filter(
                                                (cat: string) => cat !== category
                                              );
                                              form.setValue('categories', updatedCategories);
                                            }}
                                          />
                                        </Badge>
                                      );
                                    })
                                  ) : (
                                    <span className="text-sm text-muted-foreground p-1">
                                      No categories selected
                                    </span>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 gap-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="w-full"
                                        type="button"
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Category
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
                                      <DropdownMenuLabel>Predefined Categories</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      {predefinedCategories.map(category => (
                                        <DropdownMenuItem
                                          key={category.id}
                                          onClick={() => {
                                            const currentCategories = Array.isArray(field.value) ? field.value : [];
                                            
                                            // Only add if not already in the list
                                            if (!currentCategories.includes(category.id)) {
                                              form.setValue('categories', [
                                                ...currentCategories,
                                                category.id
                                              ]);
                                            }
                                          }}
                                        >
                                          {category.name}
                                        </DropdownMenuItem>
                                      ))}
                                      
                                      {customCategories.length > 0 && (
                                        <>
                                          <DropdownMenuLabel>Custom Categories</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          {customCategories.map(category => (
                                            <DropdownMenuItem
                                              key={category.id}
                                              onClick={() => {
                                                const currentCategories = Array.isArray(field.value) ? field.value : [];
                                                
                                                // Only add if not already in the list
                                                if (!currentCategories.includes(category.id)) {
                                                  form.setValue('categories', [
                                                    ...currentCategories,
                                                    category.id
                                                  ]);
                                                }
                                              }}
                                            >
                                              {category.name}
                                            </DropdownMenuItem>
                                          ))}
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <FormDescription className="text-xs">
                                Add categories to organize your content
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Custom Category Input */}
                        <FormField
                          control={form.control}
                          name="customCategory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Add Custom Category</FormLabel>
                              <div className="flex space-x-2">
                                <FormControl>
                                  <Input
                                    placeholder="Enter new category name"
                                    {...field}
                                    className="flex-1"
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (field.value) {
                                      addCustomCategory(field.value);
                                      // Clear the input after adding
                                      form.setValue('customCategory', '');
                                    }
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              </div>
                              <FormDescription className="text-xs">
                                Create your own custom categories
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="writingPerspective"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Writing Perspective</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select perspective" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="first_person_singular">First Person Singular (I, me, my, mine)</SelectItem>
                                <SelectItem value="first_person_plural">First Person Plural (we, us, our, ours)</SelectItem>
                                <SelectItem value="second_person">Second Person (you, your, yours)</SelectItem>
                                <SelectItem value="third_person">Third Person (he, she, it, they)</SelectItem>

                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Content Style Selector - New Feature */}
                      <div className="mb-6">
                        <FormLabel className="mb-2 block">Content Style</FormLabel>
                        <ContentStyleSelector 
                          onSelectionChange={(toneId, displayName) => {
                            setSelectedContentToneId(toneId);
                            setSelectedContentDisplayName(displayName);
                          }}
                          className="mt-2"
                        />

                      </div>
                      
                      <FormField
                        control={form.control}
                        name="toneOfVoice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tone of Voice</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select tone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="neutral">Neutral</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="empathetic">Empathetic</SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                                <SelectItem value="excited">Excited</SelectItem>
                                <SelectItem value="formal">Formal</SelectItem>
                                <SelectItem value="friendly">Friendly</SelectItem>
                                <SelectItem value="humorous">Humorous</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="introType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Introduction Style</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value || "search_intent"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select intro style" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="search_intent">Search Intent Focused (Recommended)</SelectItem>
                                <SelectItem value="standard">Standard Introduction</SelectItem>
                                <SelectItem value="none">No Introduction</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="faqType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>FAQ Section</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select FAQ style" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No FAQ Section</SelectItem>
                                <SelectItem value="short">Short FAQ (3-5 Q&A)</SelectItem>
                                <SelectItem value="long">Long FAQ (5-7 Q&A)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="enableTables"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Enable Tables
                                </FormLabel>
                                <FormDescription>
                                  Use comparison tables
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="enableLists"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Enable Lists
                                </FormLabel>
                                <FormDescription>
                                  Use bullet points
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="enableH3s"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Enable H3 Headings
                                </FormLabel>
                                <FormDescription>
                                  Use sub-headings
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="enableCitations"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Enable Citations
                                </FormLabel>
                                <FormDescription>
                                  Add external links
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    
                    {/* Products & Collections section - Temporarily commented out to fix display issues
                    <div className="space-y-4 pt-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-500" />
                        Products & Collections
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Select products and collections to feature in your content
                      </p>
                      
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="productIds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Featured Products</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={productsQuery.data?.products.map(product => ({
                                    label: product.title,
                                    value: product.id
                                  })) || []}
                                  selected={Array.isArray(field.value) ? field.value : []}
                                  onChange={(selected) => {
                                    setSelectedProducts(selected);
                                    field.onChange(selected);
                                    console.log("Products selected:", selected);
                                  }}
                                  placeholder="Select products to feature in content..."
                                />
                              </FormControl>
                              <div className="text-sm text-muted-foreground m-0 mt-1">
                                Products will be mentioned and linked in your content
                                {Array.isArray(field.value) && field.value.length > 0 && (
                                  <div className="font-medium text-foreground mt-1">
                                    {field.value.length} product(s) selected
                                  </div>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="collectionIds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Featured Collections</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={collectionsQuery.data?.collections.map(collection => ({
                                    label: collection.title,
                                    value: collection.id
                                  })) || []}
                                  selected={Array.isArray(field.value) ? field.value : []}
                                  onChange={(selected) => {
                                    setSelectedCollections(selected);
                                    field.onChange(selected);
                                    console.log("Collections selected:", selected);
                                  }}
                                  placeholder="Select collections to feature in content..."
                                />
                              </FormControl>
                              <div className="text-sm text-muted-foreground m-0 mt-1">
                                Collections will be mentioned and linked in your content
                                {Array.isArray(field.value) && field.value.length > 0 && (
                                  <div className="font-medium text-foreground mt-1">
                                    {field.value.length} collection(s) selected
                                  </div>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    */}
                    
                    {/* Media Selection Section */}
                    <div className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="generateImages"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Generate Images
                              </FormLabel>
                              <FormDescription>
                                Select images for your content from Pexels
                              </FormDescription>
                              {field.value && (
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="mt-2" 
                                  onClick={() => {
                                    // Close any existing dialogs first to prevent overlap
                                    if (showChooseMediaDialog) {
                                      setShowChooseMediaDialog(false);
                                      setTimeout(() => setShowImageDialog(true), 300);
                                    } else {
                                      setShowImageDialog(true);
                                    }
                                  }}
                                >
                                  {Array.isArray(selectedImages) && selectedImages.length > 0 
                                    ? `${selectedImages.length} Image(s) Selected` 
                                    : "Search & Select Images"}
                                </Button>
                              )}
                            </div>
                          </FormItem>
                        )}
                      />
                      


                    {/* Image Selection Dialog */}
                      <ImageSearchDialog
                        open={showImageDialog}
                        onOpenChange={setShowImageDialog}
                        onImagesSelected={(images) => {
                          setSelectedImages(images);
                          toast({
                            title: `${images.length} image(s) selected`,
                            description: "Images will be included in your content",
                          });
                        }}
                        initialSelectedImages={selectedImages}
                        selectedKeywords={selectedKeywords.map(k => ({
                          keyword: k.keyword,
                          isMainKeyword: k === selectedKeywords[0] // First keyword is main
                        }))}
                      />
                    </div>
                    
                    {/* Template Controls */}
                    <div className="mt-6 grid grid-cols-2 gap-3 hidden">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setTemplateName('');
                          setShowSaveTemplateDialog(true);
                        }}
                      >
                        Save as Template
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setShowLoadTemplateDialog(true)}
                        disabled={templates.length === 0}
                      >
                        Load Template
                      </Button>
                    </div>
                    
                    {/* Sticky Generate Content button fixed to bottom of screen */}
                    <div className="sticky bottom-6 left-0 right-0 mt-8 z-10">
                      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200">
                        <Button 
                          type="button" 
                          className="w-full" 
                          disabled={isGenerating}
                          onClick={() => {
                            // Manually trigger form submission
                            const values = form.getValues();
                            console.log("Manual form submission triggered with values:", values);
                            handleSubmit(values);
                          }}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating Content...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate Content
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Content Preview</CardTitle>
                <CardDescription>
                  Preview of your generated content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Generating content with AI. This might take a minute...
                    </p>
                  </div>
                ) : generatedContent ? (
                  <div className="space-y-6">
                    {/* Editable Meta Title */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Meta Title</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={generatedContent.title}
                          onChange={(e) => {
                            setGeneratedContent(prev => ({
                              ...prev,
                              title: e.target.value
                            }));
                          }}
                          className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your meta title..."
                        />
                        <div className="absolute right-3 top-3 text-xs text-gray-500">
                          {generatedContent.title?.length || 0}/60
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Optimal length: 50-60 characters for SEO</p>
                    </div>

                    {/* Editable Meta Description */}
                    {generatedContent.metaDescription && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Meta Description</label>
                        <div className="relative">
                          <textarea
                            value={generatedContent.metaDescription}
                            onChange={(e) => {
                              setGeneratedContent(prev => ({
                                ...prev,
                                metaDescription: e.target.value
                              }));
                            }}
                            rows={3}
                            className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Enter your meta description..."
                          />
                          <div className="absolute right-3 bottom-3 text-xs text-gray-500">
                            {generatedContent.metaDescription?.length || 0}/160
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Optimal length: 150-160 characters for SEO</p>
                      </div>
                    )}

                    {/* Featured Image with Badge */}
                    {generatedContent.featuredImage && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Featured Image</label>
                        <div className="relative mb-6">
                          <div className="absolute top-2 left-2 z-10">
                            <Badge className="bg-blue-600 text-white">Featured Image</Badge>
                          </div>
                          <ShopifyImageViewer 
                            src={generatedContent.featuredImage.src?.medium || generatedContent.featuredImage.url} 
                            alt={generatedContent.featuredImage.alt || generatedContent.title} 
                            className="w-full h-auto rounded-md shadow-md"
                          />
                        </div>
                      </div>
                    )}

                    {/* Tags with Clear Label */}
                    {generatedContent.tags && generatedContent.tags.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Content Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {generatedContent.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">These tags will be applied to your {form.watch('articleType') === 'blog' ? 'blog post' : 'page'}</p>
                      </div>
                    )}

                    {/* Editable Content Section */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-gray-700">Content Body</label>
                      
                      {/* Visual Editor Toolbar */}
                      <div className="border border-gray-200 rounded-t-md bg-gray-50 p-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => document.execCommand('bold', false)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 font-bold"
                          title="Bold"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => document.execCommand('italic', false)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 italic"
                          title="Italic"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => document.execCommand('underline', false)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 underline"
                          title="Underline"
                        >
                          U
                        </button>
                        <div className="border-l border-gray-300 mx-1"></div>
                        <button
                          type="button"
                          onClick={() => document.execCommand('formatBlock', false, 'h1')}
                          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                          title="Heading 1"
                        >
                          H1
                        </button>
                        <button
                          type="button"
                          onClick={() => document.execCommand('formatBlock', false, 'h2')}
                          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                          title="Heading 2"
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          onClick={() => document.execCommand('formatBlock', false, 'h3')}
                          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                          title="Heading 3"
                        >
                          H3
                        </button>
                        <div className="border-l border-gray-300 mx-1"></div>
                        <button
                          type="button"
                          onClick={() => document.execCommand('insertUnorderedList', false)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                          title="Bullet List"
                        >
                          • List
                        </button>
                        <button
                          type="button"
                          onClick={() => document.execCommand('insertOrderedList', false)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                          title="Numbered List"
                        >
                          1. List
                        </button>
                      </div>

                      {/* Content Editor with Inline Media */}
                      <div
                        key={contentEditorKey}
                        ref={(el) => {
                          // Only set content on initial load, never re-process during editing
                          if (el && generatedContent.content && !el.hasAttribute('data-content-loaded')) {
                            // Process content to render embedded images and videos properly
                            let processedContent = generatedContent.content;
                            
                            // Ensure images have proper styling and are visible
                            processedContent = processedContent.replace(
                              /<img([^>]*?)>/gi,
                              '<img$1 style="max-width: 100%; height: auto; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">'
                            );
                            
                            // Ensure iframes (YouTube videos) have proper styling
                            processedContent = processedContent.replace(
                              /<iframe([^>]*?)>/gi,
                              '<div style="margin: 30px 0; text-align: center;"><iframe$1 style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">'
                            );
                            
                            // Close the wrapper div for iframes
                            processedContent = processedContent.replace(
                              /<\/iframe>/gi,
                              '</iframe></div>'
                            );
                            
                            // Set content once and mark as loaded
                            el.innerHTML = processedContent;
                            el.setAttribute('data-content-loaded', 'true');
                          } else if (el && !generatedContent.content && el.hasAttribute('data-content-loaded')) {
                            // Clear content and reset when no content
                            el.removeAttribute('data-content-loaded');
                            el.innerHTML = '<p>Your generated content will appear here for editing...</p>';
                          } else if (el && !generatedContent.content && !el.hasAttribute('data-content-loaded')) {
                            el.innerHTML = '<p>Your generated content will appear here for editing...</p>';
                          }
                        }}
                        contentEditable
                        suppressContentEditableWarning={true}
                        className="min-h-[400px] max-h-[60vh] overflow-y-auto p-5 border border-gray-200 rounded-b-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent prose prose-blue max-w-none"
                        style={{ 
                          borderTop: 'none',
                          lineHeight: '1.6',
                          fontSize: '16px'
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLDivElement;
                          setGeneratedContent(prev => ({
                            ...prev,
                            content: target.innerHTML
                          }));
                        }}
                      />
                      
                      {/* Word Count */}
                      <div className="text-xs text-gray-500 text-right">
                        Words: {generatedContent.content ? 
                          generatedContent.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length 
                          : 0}
                      </div>
                    </div>



                    <div className="hidden">
                      {(() => {
                        // Get content
                        const content = generatedContent.content;
                        if (!content) return <p>No content available</p>;

                        // Get YouTube data if exists
                        const youtubeUrl = form.watch("youtubeUrl");
                        let youtubeVideoId: string | null = null;
                        if (youtubeUrl) {
                          youtubeVideoId = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/)?.[1] || null;
                        }
                        
                        // Create YouTube embed component
                        const YouTubeEmbed = () => (
                          <div className="my-8 flex justify-center">
                            <iframe 
                              width="560" 
                              height="315" 
                              src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                              title="YouTube video" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowFullScreen
                              className="rounded-md border border-gray-200"
                            />
                          </div>
                        );
                        
                        // Check if content has YouTube placeholder
                        const hasYoutubePlaceholder = content.includes('[YOUTUBE_EMBED_PLACEHOLDER]');
                        
                        // If content has placeholder, split and insert YouTube
                        if (youtubeVideoId && hasYoutubePlaceholder) {
                          const parts = content.split('[YOUTUBE_EMBED_PLACEHOLDER]');
                          return (
                            <div className="content-preview prose prose-blue max-w-none">
                              {parts[0] && <div dangerouslySetInnerHTML={{ __html: parts[0] }} />}
                              <YouTubeEmbed />
                              {parts[1] && <div dangerouslySetInnerHTML={{ __html: parts[1] }} />}
                            </div>
                          );
                        } 
                        
                        // Get secondary images
                        const secondaryImages = generatedContent.secondaryImages || [];
                        
                        // Check for image tags in content 
                        const hasImageTags = content.includes('<img');

                        // If content has no YouTube placeholder but has secondary images or image tags
                        if (secondaryImages.length > 0 || hasImageTags) {
                          // Always consider content as having proper images
                          // This ensures embedded images are always preserved
                          const hasProperImages = true;
                          
                          if (hasProperImages) {
                            // Enhanced processing for all content with images
                            let enhancedContent = content;
                            
                            // Process all <a> tags with embedded images to ensure they display properly and are clickable
                            enhancedContent = enhancedContent.replace(
                              /<a\s+[^>]*?href=["']([^"']+)["'][^>]*?>(\s*)<img([^>]*?)src=["']([^"']+)["']([^>]*?)>(\s*)<\/a>/gi,
                              (match, href, prespace, imgAttr, src, imgAttrEnd, postspace) => {
                                // Ensure src is absolute URL
                                let fixedSrc = src;
                                if (!src.startsWith('http')) {
                                  fixedSrc = 'https://' + src;
                                } else if (src.startsWith('//')) {
                                  fixedSrc = 'https:' + src;
                                }
                                
                                // Make sure the image is inside an <a> tag and properly styled
                                return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; margin: 1.5rem 0;" class="product-link">${prespace}<img${imgAttr}src="${fixedSrc}"${imgAttrEnd} style="max-width: 100%; max-height: 400px; object-fit: contain; margin: 0 auto; display: block; border-radius: 4px; cursor: pointer;">${postspace}</a>`;
                              }
                            );
                            
                            // Convert standalone images to be wrapped in product links when possible
                            // First find images without surrounding <a> tags
                            const imgRegex = /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
                            const matches = Array.from(enhancedContent.matchAll(imgRegex));
                            
                            // Get products if available 
                            const products = selectedProducts || [];
                            
                            // Process each standalone image
                            matches.forEach(match => {
                              // Skip if the image is already inside an <a> tag
                              const fullMatch = match[0];
                              const beforeMatch = enhancedContent.substring(0, match.index);
                              const afterMatch = enhancedContent.substring(match.index + fullMatch.length);
                              
                              // Check if this image is already in an <a> tag
                              const isInLink = (beforeMatch.lastIndexOf('<a') > beforeMatch.lastIndexOf('</a>')) && 
                                             (afterMatch.indexOf('</a>') < afterMatch.indexOf('<a') || afterMatch.indexOf('<a') === -1);
                              
                              if (!isInLink) {
                                // This is a standalone image, try to wrap it in a product link
                                const imgElement = fullMatch;
                                const imgSrc = match[2];
                                
                                // Normalize the img source for comparison
                                let normalizedImgSrc = imgSrc;
                                // Remove http/https and domain for comparison
                                if (typeof normalizedImgSrc === 'string' && normalizedImgSrc.startsWith('http')) {
                                  try {
                                    // Try to get just the path portion for more flexible matching
                                    const url = new URL(normalizedImgSrc);
                                    normalizedImgSrc = url.pathname;
                                  } catch (e) {
                                    // If URL parsing fails, continue with the original
                                    console.log("Failed to parse URL:", imgSrc);
                                  }
                                }
                                
                                // Find a matching product if possible - with more flexible matching
                                const matchingProduct = products.find(p => {
                                  if (!p.image) return false;
                                  
                                  // Try to normalize product image as well
                                  let normalizedProductImg = p.image;
                                  if (typeof normalizedProductImg === 'string' && normalizedProductImg.startsWith('http')) {
                                    try {
                                      const url = new URL(normalizedProductImg);
                                      normalizedProductImg = url.pathname;
                                    } catch (e) {
                                      // If URL parsing fails, continue with the original
                                    }
                                  }
                                  
                                  // Check if either image includes parts of the other
                                  return (typeof normalizedProductImg === 'string' && normalizedProductImg.includes(normalizedImgSrc)) || 
                                         (typeof normalizedImgSrc === 'string' && normalizedImgSrc.includes(normalizedProductImg));
                                });
                                
                                // Style the image regardless of product match
                                const styledImg = imgElement.replace(/<img/, '<img style="max-width: 100%; max-height: 400px; object-fit: contain; margin: 0 auto; display: block; border-radius: 4px; cursor: pointer;"');
                                
                                if (matchingProduct) {
                                  // Replace the image with a linked version
                                  const linkedImg = `<a href="${matchingProduct.admin_url || '#'}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; margin: 1.5rem 0;" class="product-link">${styledImg}</a>`;
                                  enhancedContent = enhancedContent.replace(imgElement, linkedImg);
                                } else {
                                  // Still replace with styled version even without product match
                                  enhancedContent = enhancedContent.replace(imgElement, styledImg);
                                }
                              }
                            });
                            
                            // Then process any remaining standalone images
                            enhancedContent = enhancedContent
                              // Fix relative image URLs to absolute URLs (adding https:// if missing)
                              .replace(
                                /<img([^>]*?)src=["'](?!http)([^"']+)["']([^>]*?)>/gi,
                                '<img$1src="https://$2"$3>'
                              )
                              // Fix image URLs that might be missing domain (starting with //)
                              .replace(
                                /<img([^>]*?)src=["'](\/\/)([^"']+)["']([^>]*?)>/gi,
                                '<img$1src="https://$3"$4>'
                              );
                              
                            // Wrap standalone images (those not in an <a> tag) with clickable links
                            const imgRegexStandalone = /(?<!<a[^>]*?>)(<img[^>]*?src=["']([^"']+)["'][^>]*?>)(?!<\/a>)/gi;
                            enhancedContent = enhancedContent.replace(
                              imgRegexStandalone,
                              (match, imgTag, imgSrc) => {
                                return `<a href="${imgSrc}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; margin: 1.5rem 0;" class="image-link">${imgTag}</a>`;
                              }
                            );
                            
                            // Log for debugging
                            console.log("Content before final processing:", enhancedContent);
                            
                            // Add styling to all remaining images that don't already have style
                            enhancedContent = enhancedContent.replace(
                              /<img((?![^>]*?style=["'][^"']*)[^>]*?)>/gi, 
                              '<img$1 style="max-width: 100%; max-height: 400px; object-fit: contain; margin: 1rem auto; display: block; cursor: pointer;">'
                            );
                            
                            // Ensure all images have cursor pointer
                            enhancedContent = enhancedContent.replace(
                              /<img([^>]*?)style=["']([^"']*)["']([^>]*?)>/gi,
                              (match, before, style, after) => {
                                // Add cursor: pointer if it's not already there
                                const updatedStyle = style.includes('cursor:') ? style : style + '; cursor: pointer;';
                                return `<img${before}style="${updatedStyle}"${after}>`;
                              }
                            );
                            
                            // Return the enhanced content with proper image styling
                            return <div className="content-preview prose prose-blue max-w-none" dangerouslySetInnerHTML={{ __html: enhancedContent }} />;
                          } else {
                            // Remove any img tags without proper src
                            let cleanedContent = content;
                            if (hasImageTags) {
                              cleanedContent = content.replace(/<img[^>]*?(?!src=["'][^"']+["'])[^>]*?>/gi, '');
                            }
                            
                            // Split into paragraphs
                            const paragraphs = cleanedContent.split(/\n\n+/);
                            const result: React.ReactNode[] = [];
                            let imageIndex = 0;
                            
                            // Process each paragraph, inserting images occasionally
                            paragraphs.forEach((para: string, i: number) => {
                              // Check if paragraph already has image tags
                              const hasImageInParagraph = para.includes('<img');
                              
                              if (para.trim()) {
                                // Process paragraph to ensure proper image handling
                                const processedPara = para
                                  // Fix relative image URLs to absolute URLs (adding https:// if missing)
                                  .replace(
                                    /<img([^>]*?)src=["'](?!http)([^"']+)["']([^>]*?)>/gi,
                                    '<img$1src="https://$2"$3>'
                                  )
                                  // Fix image URLs that might be missing domain (starting with //)
                                  .replace(
                                    /<img([^>]*?)src=["'](\/\/)([^"']+)["']([^>]*?)>/gi,
                                    '<img$1src="https://$3"$4>'
                                  )
                                  // Add styling to all images for proper display
                                  .replace(
                                    /<img([^>]*?)>/gi, 
                                    '<img$1 style="max-width: 100%; max-height: 400px; object-fit: contain; margin: 1rem auto; display: block;">'
                                  );
                                
                                result.push(
                                  <div key={`p-${i}`} dangerouslySetInnerHTML={{ __html: processedPara }} />
                                );
                              }
                              
                              // Only insert secondary images if the paragraph doesn't already have images
                              // And do it after every 2-3 paragraphs for optimal spacing
                              if (!hasImageInParagraph && (i + 1) % 2 === 0 && imageIndex < secondaryImages.length) {
                                const image = secondaryImages[imageIndex];
                                
                                // Try to find a matching product for this image
                                let productUrl = image.productUrl || "#";
                                
                                // Check if this image belongs to a selected product
                                const products = selectedProducts || [];
                                if (products.length > 0 && image.url) {
                                  const matchingProduct = products.find(p => 
                                    p.image && (p.image === image.url || image.url?.includes(p.id))
                                  );
                                  
                                  if (matchingProduct) {
                                    productUrl = matchingProduct.admin_url || productUrl;
                                  }
                                }
                                
                                result.push(
                                  <div key={`img-${i}`} className="my-6 flex justify-center">
                                    <a href={productUrl} target="_blank" rel="noopener noreferrer" className="product-link">
                                      <img 
                                        src={image.url || (image.src?.medium ?? '')} 
                                        alt={image.alt || `Product image ${imageIndex + 1}`} 
                                        style={{
                                          maxWidth: '100%',
                                          maxHeight: '400px',
                                          cursor: 'pointer', 
                                          objectFit: 'contain',
                                          margin: '1rem auto',
                                          display: 'block',
                                          borderRadius: '0.375rem'
                                        }}
                                      />
                                    </a>
                                  </div>
                                );
                                imageIndex++;
                              }
                              
                              // Insert YouTube after first or second paragraph if not already inserted via placeholder
                              if (youtubeVideoId && !hasYoutubePlaceholder && (i === 0 || i === 1)) {
                                result.push(<YouTubeEmbed key="youtube" />);
                                // Prevent multiple inserts
                                youtubeVideoId = null;
                              }
                            });
                            
                            return <div className="content-preview prose prose-blue max-w-none">{result}</div>;
                          }
                        }
                        
                        // If no secondary images or YouTube placeholder, handle YouTube separately
                        if (youtubeVideoId && !hasYoutubePlaceholder) {
                          return (
                            <div className="content-preview prose prose-blue max-w-none">
                              <div dangerouslySetInnerHTML={{ 
                                __html: content.substring(0, content.length / 3)
                                  // Fix relative image URLs to absolute URLs (adding https:// if missing)
                                  .replace(
                                    /<img([^>]*?)src=["'](?!http)([^"']+)["']([^>]*?)>/gi,
                                    '<img$1src="https://$2"$3>'
                                  )
                                  // Fix image URLs that might be missing domain (starting with //)
                                  .replace(
                                    /<img([^>]*?)src=["'](\/\/)([^"']+)["']([^>]*?)>/gi,
                                    '<img$1src="https://$3"$4>'
                                  )
                                  // Add styling to all images for proper display
                                  .replace(
                                    /<img([^>]*?)>/gi, 
                                    '<img$1 style="max-width: 100%; max-height: 400px; object-fit: contain; margin: 1rem auto; display: block;">'
                                  )
                              }} />
                              <YouTubeEmbed />
                              <div dangerouslySetInnerHTML={{ 
                                __html: content.substring(content.length / 3)
                                  // Fix relative image URLs to absolute URLs (adding https:// if missing)
                                  .replace(
                                    /<img([^>]*?)src=["'](?!http)([^"']+)["']([^>]*?)>/gi,
                                    '<img$1src="https://$2"$3>'
                                  )
                                  // Fix image URLs that might be missing domain (starting with //)
                                  .replace(
                                    /<img([^>]*?)src=["'](\/\/)([^"']+)["']([^>]*?)>/gi,
                                    '<img$1src="https://$3"$4>'
                                  )
                                  // Add styling to all images for proper display
                                  .replace(
                                    /<img([^>]*?)>/gi, 
                                    '<img$1 style="max-width: 100%; max-height: 400px; object-fit: contain; margin: 1rem auto; display: block;">'
                                  )
                              }} />
                            </div>
                          );
                        }
                        
                        // Default: ensure content displays correctly with embedded images
                        const processedContent = content
                          // Fix relative image URLs to absolute URLs (adding https:// if missing)
                          .replace(
                            /<img([^>]*?)src=["'](?!http)([^"']+)["']([^>]*?)>/gi,
                            '<img$1src="https://$2"$3>'
                          )
                          // Fix image URLs that might be missing domain (starting with //)
                          .replace(
                            /<img([^>]*?)src=["'](\/\/)([^"']+)["']([^>]*?)>/gi,
                            '<img$1src="https://$3"$4>'
                          )
                          // Add styling to all images for proper display
                          .replace(
                            /<img([^>]*?)>/gi, 
                            '<img$1 style="max-width: 100%; max-height: 400px; object-fit: contain; margin: 1rem auto; display: block;">'
                          );
                        
                        // Return enhanced content with all embedded images properly displayed
                        return <div className="content-preview prose prose-blue max-w-none" dangerouslySetInnerHTML={{ __html: processedContent }} />;
                      })()}
                    </div>
                    
                    {generatedContent.metaDescription && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold">Meta Description:</h4>
                        <p className="text-sm text-muted-foreground">
                          {generatedContent.metaDescription}
                        </p>
                      </div>
                    )}
                    
                    {(generatedContent.contentUrl || generatedContent.shopifyUrl) && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            const url = generatedContent.shopifyUrl || generatedContent.contentUrl;
                            window.open(url, '_blank');
                          }}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View in Shopify
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            const url = generatedContent.shopifyUrl || generatedContent.contentUrl;
                            navigator.clipboard.writeText(url);
                            toast({
                              title: "Link copied",
                              description: "Shopify URL has been copied to clipboard",
                              variant: "default"
                            });
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Link
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground">
                      Content will appear here after generation.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Fill out the form and click "Generate Content" to create new content.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Publication Settings - Moved below Content Preview */}
            {generatedContent && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Publication Settings</CardTitle>
                  <CardDescription>
                    Choose how to publish your content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <div className="space-y-6">
                      {/* Publication Status */}
                      <FormField
                        control={form.control}
                        name="postStatus"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormLabel>Publish Status</FormLabel>
                              {form.getValues('scheduledPublishDate') && (
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                  <CalendarCheck className="h-3 w-3 mr-1" />
                                  Scheduled
                                </Badge>
                              )}
                            </div>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue('publicationType', value === 'publish' ? 'publish' : 'draft');
                                if (form.getValues('scheduledPublishDate')) {
                                  form.setValue('publicationType', 'schedule');
                                }
                              }} 
                              defaultValue={field.value}
                              disabled={!!form.getValues('scheduledPublishDate')}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">Save as Draft</SelectItem>
                                <SelectItem value="publish">Publish Immediately</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choose whether to publish immediately or save as draft. 
                              <strong>Note:</strong> If "Schedule for later" is checked below, this post will be saved as a draft and published at the scheduled time.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Schedule for Later */}
                      <FormField
                        control={form.control}
                        name="scheduledPublishDate"
                        render={({ field }) => (
                          <FormItem className="rounded-md border border-slate-200 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <CalendarCheck className="h-5 w-5 text-blue-500 mr-2" />
                                <FormLabel className="text-lg font-medium">
                                  Schedule for later
                                </FormLabel>
                              </div>
                              <FormControl>
                                <Checkbox
                                  checked={!!field.value}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      const tomorrow = new Date();
                                      tomorrow.setDate(tomorrow.getDate() + 1);
                                      tomorrow.setHours(9, 0, 0, 0);
                                      field.onChange(tomorrow.toISOString().split('T')[0]);
                                      form.setValue('publicationType', 'schedule');
                                    } else {
                                      field.onChange(undefined);
                                      const currentPostStatus = form.getValues('postStatus');
                                      form.setValue('publicationType', 
                                        currentPostStatus === 'publish' ? 'publish' : 'draft');
                                    }
                                  }}
                                />
                              </FormControl>
                            </div>
                            {field.value && (
                              <div className="space-y-3 pt-3 border-t border-slate-200">
                                <div className="flex flex-col space-y-2">
                                  <FormLabel className="text-sm">Publication Date</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="date"
                                      value={field.value}
                                      onChange={field.onChange}
                                      min={new Date().toISOString().split('T')[0]}
                                      className="w-40"
                                    />
                                  </FormControl>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div className="flex flex-col">
                                    <FormLabel className="text-sm mb-1">Publication Time</FormLabel>
                                    <Input
                                      type="time"
                                      value={form.watch('scheduledPublishTime') || "09:30"}
                                      onChange={(e) => form.setValue('scheduledPublishTime', e.target.value)}
                                      className="w-32"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </FormItem>
                        )}
                      />

                      {/* Publication Action Buttons */}
                      <div className="flex flex-col gap-3">
                        {/* Publish Now Button */}
                        <Button 
                          type="button" 
                          onClick={() => handlePublishContent('publish')}
                          disabled={isGenerating}
                          className="w-full"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Publish Now
                        </Button>

                        {/* Save as Draft Button */}
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => handlePublishContent('draft')}
                          disabled={isGenerating}
                          className="w-full"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save as Draft
                        </Button>

                        {/* Schedule Publication Button - only show if date is selected */}
                        {form.getValues('scheduledPublishDate') && (
                          <Button 
                            type="button" 
                            variant="secondary"
                            onClick={() => handlePublishContent('schedule')}
                            disabled={isGenerating}
                            className="w-full"
                          >
                            <CalendarCheck className="mr-2 h-4 w-4" />
                            Schedule Publication
                          </Button>
                        )}
                      </div>
                    </div>
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Keyword Selector Dialog */}
          <Dialog open={showKeywordSelector} onOpenChange={setShowKeywordSelector}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Select Keywords</DialogTitle>
                <DialogDescription>
                  Choose keywords to optimize your content for SEO. Higher search volume keywords typically attract more traffic.
                </DialogDescription>
              </DialogHeader>
              <KeywordSelector
                initialKeywords={selectedKeywords}
                onKeywordsSelected={handleKeywordsSelected}
                onClose={() => setShowKeywordSelector(false)}
                title="Select Keywords for SEO Optimization"
                productTitle={productTitle}
                selectedProducts={selectedProducts}
                selectedCollections={selectedCollections}
              />
            </DialogContent>
          </Dialog>
          
          {/* Title Selector Dialog */}
          <Dialog open={showTitleSelector} onOpenChange={setShowTitleSelector}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Choose a Title</DialogTitle>
                <DialogDescription>
                  Select a title that incorporates your keywords for better SEO.
                </DialogDescription>
              </DialogHeader>
              
              <TitleSelector 
                open={showTitleSelector}
                onOpenChange={setShowTitleSelector}
                onTitleSelected={handleTitleSelected}
                selectedKeywords={selectedKeywords}
                productTitle={productTitle}
              />
            </DialogContent>
          </Dialog>
          
          {/* Save Template Dialog */}
          <Dialog 
            open={showSaveTemplateDialog} 
            onOpenChange={(open) => {
              if (!open) {
                setTemplateName('');
              }
              setShowSaveTemplateDialog(open);
            }}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Save as Template</DialogTitle>
                <DialogDescription>
                  Save your current settings as a template for future use
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="templateName" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="templateName"
                    value={templateName || ''}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="col-span-3"
                    placeholder="My Template"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSaveTemplateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    // Save current form values as template
                    if (!templateName) {
                      toast({
                        title: "Template name required",
                        description: "Please enter a name for your template",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    const templateData = {
                      ...form.getValues(),
                      selectedKeywords,
                      selectedProducts,
                      selectedCollections,
                      contentStyleToneId: selectedContentToneId,
                      contentStyleDisplayName: selectedContentDisplayName
                    };
                    
                    const updatedTemplates = [...templates, {
                      name: templateName,
                      data: templateData
                    }];
                    
                    setTemplates(updatedTemplates);
                    
                    // Save to localStorage
                    localStorage.setItem('topshop-templates', JSON.stringify(updatedTemplates));
                    
                    setTemplateName('');
                    setShowSaveTemplateDialog(false);
                    
                    toast({
                      title: "Template saved",
                      description: "Your template has been saved successfully",
                      variant: "default"
                    });
                  }}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Load Template Dialog */}
          <Dialog open={showLoadTemplateDialog} onOpenChange={setShowLoadTemplateDialog}>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Load Template</DialogTitle>
                <DialogDescription>
                  Select a saved template to load its settings
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[300px] overflow-y-auto">
                {templates.length > 0 ? (
                  <div className="space-y-2">
                    {templates.map((template, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">{template.name}</div>
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                // Ensure all array values are properly initialized
                                const formDataWithArrays = {
                                  ...template.data,
                                  // Initialize required arrays
                                  productIds: Array.isArray(template.data.productIds) ? template.data.productIds : [],
                                  collectionIds: Array.isArray(template.data.collectionIds) ? template.data.collectionIds : [],
                                  keywords: Array.isArray(template.data.keywords) ? template.data.keywords : []
                                };
                                
                                // Load template data into form
                                form.reset(formDataWithArrays);
                                
                                // Update selected states
                                if (template.data.selectedKeywords) {
                                  setSelectedKeywords(template.data.selectedKeywords);
                                }
                                
                                if (template.data.selectedProducts) {
                                  setSelectedProducts(Array.isArray(template.data.selectedProducts) ? template.data.selectedProducts : []);
                                }
                                
                                if (template.data.selectedCollections) {
                                  setSelectedCollections(Array.isArray(template.data.selectedCollections) ? template.data.selectedCollections : []);
                                }
                                
                                // Set content style if available in the template
                                if (template.data.contentStyleToneId) {
                                  setSelectedContentToneId(template.data.contentStyleToneId);
                                }
                                
                                if (template.data.contentStyleDisplayName) {
                                  setSelectedContentDisplayName(template.data.contentStyleDisplayName);
                                }
                                
                                setShowLoadTemplateDialog(false);
                                
                                toast({
                                  title: "Template loaded",
                                  description: "Template settings have been applied",
                                  variant: "default"
                                });
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Load
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                // Remove this template
                                const updatedTemplates = templates.filter((_, i) => i !== index);
                                setTemplates(updatedTemplates);
                                
                                // Update localStorage
                                localStorage.setItem('topshop-templates', JSON.stringify(updatedTemplates));
                                
                                toast({
                                  title: "Template deleted",
                                  description: `"${template.name}" has been removed`,
                                  variant: "default"
                                });
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No saved templates. Save a template first.
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLoadTemplateDialog(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Connections</CardTitle>
              <CardDescription>
                Check the status of your connected services
              </CardDescription>
            </CardHeader>
            <CardContent>
              {servicesStatusQuery.isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : servicesStatusQuery.data ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(servicesStatusQuery.data.connections as ServiceStatus).map(([service, status]) => (
                    <Card key={service}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          {status ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          {service.charAt(0).toUpperCase() + service.slice(1)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {status 
                            ? `Connected and working properly.` 
                            : `Not connected or having issues.`}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0">
                        {!status && (
                          <Button variant="outline" size="sm">
                            Fix Connection
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Failed to load service status. Please try again.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>
                Configure your TopShop SEO application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-12">
                Settings functionality coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      

      
      {/* Image Search Dialog */}
      <Dialog open={showImageDialog && !showChooseMediaDialog} onOpenChange={(open) => {
        // When dialog closes, always reset the UI to a clean state
        if (!open) {
          // Reset loading state if dialog is closed during a search
          if (isSearchingImages) {
            setIsSearchingImages(false);
          }
        }
        
        // Ensure only one dialog is open at a time
        if (open && showChooseMediaDialog) {
          setShowChooseMediaDialog(false); // Close the other dialog first
          setTimeout(() => setShowImageDialog(open), 300); // Then open this one after a short delay
        } else {
          setShowImageDialog(open);
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-3 border-b mb-4">
            <div className="flex justify-between items-center mb-2">
              <DialogTitle className="text-xl">Choose Media</DialogTitle>
              
              <Tabs 
                value={imageTab} 
                onValueChange={(v) => setImageTab(v as 'primary' | 'secondary')}
                className="w-[400px]"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="primary" className="flex items-center">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Primary Images
                    {primaryImages.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{primaryImages.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="secondary" className="flex items-center">
                    <FileImage className="h-4 w-4 mr-2" />
                    Secondary Images
                    {secondaryImages.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{secondaryImages.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <DialogDescription className="mt-1">
              {imageTab === 'primary' ? (
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-blue-700 text-sm">
                    Choose emotionally compelling images with human subjects to feature at the top of your content
                  </span>
                </div>
              ) : (
                <div className="flex items-center mb-2">
                  <Info className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-green-700 text-sm">
                    Select additional product images to appear throughout your article body
                  </span>
                </div>
              )}
            </DialogDescription>
            
            {/* Image source tabs */}
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm"
                variant={imageSource === 'pexels' ? 'default' : 'outline'} 
                onClick={() => {
                  setImageSource('pexels');
                  if (searchedImages.length === 0 && !imageSearchQuery) {
                    // Set a default search query based on selected tab
                    if (imageTab === 'primary') {
                      setImageSearchQuery("happy woman using product");
                    } else {
                      setImageSearchQuery(selectedProducts.length > 0 ? 
                        `${selectedProducts[0].title} in use` : "product in use"
                      );
                    }
                  }
                }}
                className="flex-1"
              >
                <Search className="mr-2 h-4 w-4" />
                Pexels Images
              </Button>
              
              <Button 
                size="sm"
                variant={imageSource === 'pixabay' ? 'default' : 'outline'} 
                onClick={() => {
                  setImageSource('pixabay');
                  toast({
                    title: "Coming Soon",
                    description: "Pixabay integration will be available in a future update."
                  });
                }}
                className="flex-1"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Pixabay 
                <Badge variant="outline" className="ml-2 text-xs">Soon</Badge>
              </Button>
              
              <Button 
                  size="sm"
                  variant={imageSource === 'product_images' ? 'default' : 'outline'} 
                  onClick={() => {
                    if (selectedProducts.length === 0) {
                      toast({
                        title: "No products selected",
                        description: "Please select at least one product in Step 2 first.",
                        variant: "destructive"
                      });
                      return;
                    }
                    setImageSource('product_images');
                    // Load selected product images
                    fetchProductAndVariantImages();
                  }}
                  className="flex-1"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Product Images
                </Button>
                
              
              
              <div className="flex-1 flex flex-col gap-1">
                <Button 
                  size="sm"
                  variant={imageSource === 'upload' ? 'default' : 'outline'} 
                  onClick={() => setImageSource('upload')}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
                <Button 
                  size="sm"
                  variant={imageSource === 'youtube' ? 'default' : 'outline'} 
                  onClick={() => setImageSource('youtube')}
                  className="w-full"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  YouTube Video
                </Button>
              </div>
            </div>
            
            {/* YouTube video embedding section */}
            {imageSource === 'youtube' && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-700">Add YouTube videos to embed in your content</p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <Label htmlFor="youtube-url">YouTube Video URL</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="youtube-url"
                      placeholder="https://www.youtube.com/watch?v=..." 
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      variant="default"
                      disabled={!youtubeUrl.trim()}
                      onClick={() => {
                        // Extract video ID from YouTube URL
                        try {
                          const url = new URL(youtubeUrl);
                          let videoId = '';
                          
                          if (url.hostname === 'youtu.be') {
                            videoId = url.pathname.substring(1);
                          } else if (url.hostname.includes('youtube.com')) {
                            videoId = url.searchParams.get('v') || '';
                          }
                          
                          if (videoId) {
                            setYoutubeVideoId(videoId);
                            // Create a PexelsImage-like object to store the YouTube video info
                            const youtubeImage: PexelsImage = {
                              id: `youtube-${videoId}`,
                              url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                              width: 1280,
                              height: 720,
                              alt: `YouTube video ${videoId}`,
                              type: 'youtube',
                              videoId: videoId
                            };
                            
                            if (imageTab === 'primary') {
                              setPrimaryImages([...primaryImages, youtubeImage]);
                            } else {
                              setSecondaryImages([...secondaryImages, youtubeImage]);
                            }
                            
                            // Update selectedMediaContent state immediately
                            setSelectedMediaContent(prev => ({
                              ...prev,
                              youtubeEmbed: videoId
                            }));
                            
                            toast({
                              title: "YouTube Video Added",
                              description: "YouTube video has been added to your content.",
                              variant: "default"
                            });
                            
                            // Clear the input after adding
                            setYoutubeUrl('');
                          } else {
                            toast({
                              title: "Invalid YouTube URL",
                              description: "Couldn't extract video ID from the URL",
                              variant: "destructive"
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Invalid URL",
                            description: "Please enter a valid YouTube URL",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Video
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste a YouTube video URL (like https://www.youtube.com/watch?v=abcXYZ) to embed it in your content.
                  </p>
                </div>
                
                {youtubeVideoId && (
                  <div className="mt-4 border rounded-md p-4">
                    <h4 className="text-sm font-medium mb-2">Video Ready to Add</h4>
                    <div className="bg-muted rounded-md p-3 flex items-center gap-3">
                      <div className="bg-red-100 text-red-600 p-2 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">YouTube Video ID: {youtubeVideoId}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This video will be embedded in your content when you click 'Add Video'
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Selected images preview - With fixed height to prevent overlapping buttons */}
            {((imageTab === 'primary' && primaryImages.length > 0) || 
              (imageTab === 'secondary' && secondaryImages.length > 0)) && (
              <div className="mt-4 mb-16 bg-slate-50 p-2 rounded-md border">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">
                    Your Selected {imageTab === 'primary' ? 'Primary' : 'Secondary'} Images
                  </h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (imageTab === 'primary') {
                        setPrimaryImages([]);
                      } else {
                        setSecondaryImages([]);
                      }
                      toast({
                        title: "Images cleared",
                        description: `All ${imageTab} images have been removed`
                      });
                    }}
                    className="h-7 text-xs"
                  >
                    <Trash className="mr-1 h-3 w-3" />
                    Clear All
                  </Button>
                </div>
                
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-60 overflow-y-auto p-2">
                  {(imageTab === 'primary' ? primaryImages : secondaryImages).map((img, index) => (
                    <div key={img.id} className="relative group">
                      <div className="relative aspect-square rounded-md overflow-hidden border-2 border-blue-500">
                        {img.type === 'youtube' ? (
                          <div className="w-full h-full relative">
                            <ShopifyImageViewer 
                              src={img.url} 
                              alt={img.alt || "YouTube video thumbnail"} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-red-600 text-white rounded-full p-2 shadow-lg opacity-90">
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M6 4L18 12L6 20V4Z" fill="currentColor" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <ShopifyImageViewer 
                            src={img.src?.medium || img.url} 
                            alt={img.alt || "Selected image"} 
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute top-0 left-0 bg-blue-500 text-white px-1 py-0.5 text-xs">
                          {img.type === 'youtube' ? 
                            'YouTube Video' : 
                            (imageTab === 'primary' ? 
                              (index === 0 ? 'Featured' : `Image ${index + 1}`) : 
                              `Content ${index + 1}`)}
                        </div>
                      </div>
                      
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="h-6 w-6 bg-white"
                          onClick={() => {
                            setCurrentImageEdit({
                              id: img.id,
                              alt: img.alt || ""
                            });
                            setIsEditingImage(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (imageTab === 'primary') {
                              setPrimaryImages(prev => prev.filter(i => i.id !== img.id));
                            } else {
                              setSecondaryImages(prev => prev.filter(i => i.id !== img.id));
                            }
                            toast({
                              title: "Image removed",
                              description: "Image has been removed from your selection",
                            });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogHeader>
          
          {/* Image edit dialog */}
          <Dialog open={isEditingImage} onOpenChange={setIsEditingImage}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Image Details</DialogTitle>
                <DialogDescription>
                  Add alt text and keywords to optimize your image for SEO
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="image-alt">Alt Text</Label>
                  <Input
                    id="image-alt"
                    placeholder="Describe what's in the image"
                    value={currentImageEdit.alt}
                    onChange={(e) => setCurrentImageEdit(prev => ({...prev, alt: e.target.value}))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Good alt text improves accessibility and SEO
                  </p>
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      // Generate alt text based on selected keywords
                      const keywordText = selectedKeywords.length > 0 
                        ? selectedKeywords.map(k => k.keyword).join(", ") 
                        : "product";
                      
                      setCurrentImageEdit(prev => ({
                        ...prev, 
                        alt: `Image showing ${keywordText}`
                      }));
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate from Keywords
                  </Button>
                  
                  <Button 
                    type="submit"
                    onClick={() => {
                      // Update the image alt text
                      if (imageTab === 'primary') {
                        setPrimaryImages(prev => 
                          prev.map(img => 
                            img.id === currentImageEdit.id 
                              ? {...img, alt: currentImageEdit.alt} 
                              : img
                          )
                        );
                      } else {
                        setSecondaryImages(prev => 
                          prev.map(img => 
                            img.id === currentImageEdit.id 
                              ? {...img, alt: currentImageEdit.alt} 
                              : img
                          )
                        );
                      }
                      
                      setIsEditingImage(false);
                      toast({
                        title: "Image updated",
                        description: "Image details have been saved",
                      });
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {imageSource === 'pexels' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Search for images (e.g., happy woman, smiling family, confused customer)" 
                  value={imageSearchQuery}
                  onChange={(e) => setImageSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  disabled={isSearchingImages || !imageSearchQuery.trim()} 
                  onClick={async () => {
                    setIsSearchingImages(true);
                    try {
                      // Using the correct generate-images endpoint with POST method
                      const response = await fetch('/api/admin/generate-images', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          query: imageSearchQuery,
                          count: 20
                        })
                      });
                      
                      const data = await response.json();
                      if (data.success) {
                        // Convert the response data to PexelsImage format
                        const formattedImages = data.images.map((img: any) => ({
                          id: img.id,
                          url: img.src.original,
                          width: img.width,
                          height: img.height,
                          alt: img.alt || imageSearchQuery,
                          src: img.src,
                          photographer: img.photographer,
                          photographer_url: img.photographer_url,
                          selected: false,
                          isPrimary: false,
                          source: 'pexels',
                          type: 'image'
                        }));
                        
                        setSearchedImages(formattedImages || []);
                      } else {
                        toast({
                          title: "Search Failed",
                          description: data.message || "Failed to search for images",
                          variant: "destructive"
                        });
                      }
                    } catch (error) {
                      console.error("Image search error:", error);
                      toast({
                        title: "Search Error",
                        description: "An error occurred while searching for images",
                        variant: "destructive"
                      });
                    } finally {
                      setIsSearchingImages(false);
                    }
                  }}
                >
                  {isSearchingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  {isSearchingImages ? 'Searching...' : 'Search'}
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-2">
                <Button variant="outline" size="sm" onClick={() => setImageSearchQuery("happy woman using product")}>
                  Happy woman
                </Button>
                <Button variant="outline" size="sm" onClick={() => setImageSearchQuery("satisfied customer")}>
                  Satisfied customer
                </Button>
                <Button variant="outline" size="sm" onClick={() => setImageSearchQuery("family using product")}>
                  Family
                </Button>
                <Button variant="outline" size="sm" onClick={() => setImageSearchQuery("professional man")}>
                  Professional
                </Button>
                <Button variant="outline" size="sm" onClick={() => setImageSearchQuery("person enjoying " + (selectedProducts.length > 0 ? selectedProducts[0].title : "product"))}>
                  Enjoying product
                </Button>
              </div>
              
              {isSearchingImages ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2">Searching for images...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-2">
                  {searchedImages && searchedImages.length > 0 ? searchedImages.map((image) => (
                    <div 
                      key={image.id} 
                      className={`relative rounded-md overflow-hidden border-2 hover:border-blue-400 transition-all ${image.selected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-transparent'}`}
                    >
                      <ShopifyImageViewer 
                        src={image.src?.medium || image.url} 
                        alt={image.alt || "Stock image"} 
                        className="w-full h-28 md:h-32 object-cover"
                      />
                      
                      {/* Primary/Secondary Selection buttons - always visible on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <Button 
                          size="sm" 
                          className="w-3/4 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Mark as primary image
                            const updatedImages = searchedImages.map(img => {
                              if (img.id === image.id) {
                                return { ...img, selected: true, isPrimary: true };
                              } else {
                                // Keep other images selected but not primary
                                return { ...img, isPrimary: false };
                              }
                            });
                            setSearchedImages(updatedImages);
                            
                            // Also set this as primary in the main images collection
                            setPrimaryImages([{...image, selected: true, isPrimary: true}]);
                            
                            // Update selectedMediaContent state immediately
                            setSelectedMediaContent(prev => ({
                              ...prev,
                              primaryImage: {
                                id: image.id,
                                url: image.url,
                                alt: image.alt || '',
                                width: image.width || 0,
                                height: image.height || 0,
                                source: image.source || 'pexels'
                              }
                            }));
                            
                            toast({
                              title: "Primary image selected",
                              description: "This image will appear as a featured image at the top of your content"
                            });
                          }}
                        >
                          <ImageIcon className="h-3 w-3 mr-1" />
                          Select as Primary
                        </Button>
                        
                        <Button 
                          size="sm"
                          className="w-3/4 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            // Mark as secondary image
                            const updatedImages = searchedImages.map(img =>
                              img.id === image.id ? { ...img, selected: true, isPrimary: false } : img
                            );
                            setSearchedImages(updatedImages);
                            
                            // Also add to secondary images collection
                            setSecondaryImages(prev => [...prev, {...image, selected: true, isPrimary: false}]);
                            
                            // Update selectedMediaContent state immediately
                            setSelectedMediaContent(prev => ({
                              ...prev,
                              secondaryImages: [...prev.secondaryImages, {
                                id: image.id,
                                url: image.url,
                                alt: image.alt || '',
                                width: image.width || 0,
                                height: image.height || 0,
                                source: image.source || 'pexels'
                              }]
                            }));
                            
                            toast({
                              title: "Secondary image selected",
                              description: "This image will appear throughout your content body"
                            });
                          }}
                        >
                          <FileImage className="h-3 w-3 mr-1" />
                          Select as Secondary
                        </Button>
                      </div>
                      
                      {/* Selection indicator with clear primary/secondary label */}
                      {image.selected && (
                        <>
                          <div className={`absolute top-1 right-1 ${image.isPrimary ? 'bg-blue-500' : 'bg-green-500'} text-white p-1 rounded-full`}>
                            <Check className="h-4 w-4" />
                          </div>
                          <div className={`absolute top-1 left-1 text-white text-xs px-1.5 py-0.5 rounded-sm ${image.isPrimary ? 'bg-blue-500' : 'bg-green-500'}`}>
                            {image.isPrimary ? 'Primary' : 'Secondary'}
                          </div>
                        </>
                      )}
                      
                      {image.photographer && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1 text-white text-xs truncate">
                          {image.photographer}
                        </div>
                      )}
                    </div>
                  )) : (
                    !isSearchingImages && (
                      <div className="col-span-full text-center py-6">
                        <p className="text-slate-500">No images found. Try searching for something else.</p>
                      </div>
                    )
                  )}
                </div>
              )}
              
              {!isSearchingImages && searchedImages.length === 0 && imageSearchQuery && (
                <div className="text-center py-8">
                  <p className="text-slate-500">No images found for "{imageSearchQuery}"</p>
                  <p className="text-sm text-slate-400 mt-1">Try different keywords or phrases</p>
                </div>
              )}
            </div>
          )}
          
          {imageSource === 'product_images' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Product & Variant Images</h3>
                {isLoadingMedia ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs text-slate-500">Loading images...</span>
                  </div>
                ) : shopifyFiles.length > 0 && (
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-slate-500">{shopifyFiles.length} images found</span>
                  </div>
                )}
              </div>
              
              {shopifyFiles.length === 0 && !isLoadingMedia && (
                <div className="flex flex-col items-center justify-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <div className="flex flex-col items-center gap-2 max-w-xs text-center">
                    <Package className="h-8 w-8 text-slate-400" />
                    <h3 className="text-sm font-medium">No product images found</h3>
                    <p className="text-xs text-slate-500">
                      {selectedProducts.length === 0 
                        ? "Select a product in Step 2 first to view its images here." 
                        : "The selected products don't have any associated images."}
                    </p>
                    {selectedProducts.length > 0 && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={fetchProductAndVariantImages}
                        className="mt-2"
                      >
                        <RefreshCcw className="h-3 w-3 mr-1" />
                        Refresh
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {shopifyFiles.length > 0 && !isLoadingMedia && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {shopifyFiles.map((image) => {
                      // Check if this image is selected (either as primary or secondary)
                      const isPrimary = selectedImages.some(img => 
                        img.id === image.id && img.selectionType === 'primary'
                      );
                      const isSecondary = selectedImages.some(img => 
                        img.id === image.id && img.selectionType === 'secondary'
                      );
                      const isSelected = isPrimary || isSecondary;
                      
                      // Determine if this is a product or variant image
                      const isVariant = image.source === 'variant_image';
                      
                      return (
                        <div 
                          key={image.id} 
                          className={cn(
                            "relative rounded-md overflow-hidden border group hover:shadow-md transition-all duration-200",
                            isPrimary ? "border-blue-500 ring-2 ring-blue-200" : 
                            isSecondary ? "border-green-500 ring-2 ring-green-200" : 
                            "border-slate-200"
                          )}
                        >
                          {/* Product/Variant Badge */}
                          <div className="absolute top-2 left-2 z-10">
                            <Badge variant="outline" className="text-xs bg-white/80 backdrop-blur-sm">
                              {isVariant ? (
                                <span className="flex items-center gap-1">
                                  <CircleDot className="h-3 w-3 text-purple-500" />
                                  Variant
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3 text-blue-500" />
                                  Product
                                </span>
                              )}
                            </Badge>
                          </div>
                          
                          {/* Selection Badges */}
                          {isPrimary && (
                            <div className="absolute top-2 right-2 z-10">
                              <Badge className="bg-blue-500 text-white">Primary</Badge>
                            </div>
                          )}
                          {isSecondary && (
                            <div className="absolute top-2 right-2 z-10">
                              <Badge className="bg-green-500 text-white">Secondary</Badge>
                            </div>
                          )}
                          
                          {/* Image */}
                          <div className="relative aspect-square bg-slate-100">
                            <ShopifyImageViewer
                              src={image.url}
                              alt={image.alt || "Product image"}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          
                          {/* Product/Variant Info */}
                          <div className="p-2 bg-white">
                            <p className="text-xs font-medium truncate">{image.title || image.alt || "Product image"}</p>
                            {image.product_title && (
                              <p className="text-xs text-slate-500 truncate">{image.product_title}</p>
                            )}
                            {image.variant_title && (
                              <p className="text-xs text-purple-500 truncate">{image.variant_title}</p>
                            )}
                          </div>
                          
                          {/* Selection Controls */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant={isPrimary ? "default" : "outline"}
                                className={cn(
                                  "bg-blue-500 hover:bg-blue-600 text-white",
                                  isPrimary ? "opacity-100" : "opacity-90 hover:opacity-100"
                                )}
                                onClick={() => {
                                  // Select this image as primary
                                  setPrimaryImages(prev => {
                                    // Create a new array with this image as the primary
                                    return [{ ...image, isPrimary: true }];
                                  });
                                  toast({
                                    title: "Primary image selected",
                                    description: "Image has been set as the primary featured image"
                                  });
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Primary
                              </Button>
                              <Button 
                                size="sm" 
                                variant={isSecondary ? "default" : "outline"}
                                className={cn(
                                  "bg-green-500 hover:bg-green-600 text-white",
                                  isSecondary ? "opacity-100" : "opacity-90 hover:opacity-100"
                                )}
                                onClick={() => {
                                  // Add this image to secondary images
                                  setSecondaryImages(prev => {
                                    // Check if image is already in the list
                                    const exists = prev.some(img => img.id === image.id);
                                    if (exists) {
                                      return prev; // Already added
                                    }
                                    // Add it to the list
                                    return [...prev, { ...image, isPrimary: false }];
                                  });
                                  
                                  // Update selectedMediaContent state immediately
                                  setSelectedMediaContent(prev => ({
                                    ...prev,
                                    secondaryImages: [...prev.secondaryImages, {
                                      id: image.id,
                                      url: image.url,
                                      alt: image.alt || '',
                                      width: image.width || 0,
                                      height: image.height || 0,
                                      source: image.source || 'pexels'
                                    }]
                                  }));
                                  
                                  toast({
                                    title: "Secondary image added",
                                    description: "Image has been added to your content images"
                                  });
                                }}
                              >
                                <PlusCircle className="h-4 w-4 mr-1" />
                                Secondary
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
          
          {imageSource === 'shopify_media' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Shopify Media Library</h3>
                <div className="flex gap-2">
                  <Select 
                    defaultValue="products" 
                    onValueChange={(value) => {
                      if (value === 'variants') {
                        toast({
                          title: "Showing variant images",
                          description: "Browse and select from all product variants"
                        });
                        
                        // Show product variants
                        if (selectedProducts.length > 0) {
                          // Extract all images from selected products including variants
                          const productImages: PexelsImage[] = [];
                          let uniqueImageUrls = new Set<string>();
                          
                          selectedProducts.forEach(product => {
                            // Include variant images
                            if (product.variants && Array.isArray(product.variants)) {
                              product.variants.forEach((variant, variantIndex) => {
                                if (variant.image) {
                                  const imageUrl = typeof variant.image === 'string' ? variant.image : variant.image.src;
                                  if (imageUrl && !uniqueImageUrls.has(imageUrl)) {
                                    uniqueImageUrls.add(imageUrl);
                                    productImages.push({
                                      id: `variant-${variant.id}`,
                                      url: imageUrl,
                                      width: 500,
                                      height: 500,
                                      alt: `${product.title} - ${variant.title || `Variant ${variantIndex + 1}`}`,
                                      src: {
                                        original: imageUrl,
                                        large: imageUrl,
                                        medium: imageUrl,
                                        small: imageUrl,
                                        thumbnail: imageUrl
                                      },
                                      selected: false,
                                      type: 'image'
                                    });
                                  }
                                }
                              });
                            }
                          });
                          
                          setContentFiles(productImages);
                          console.log(`Loaded ${productImages.length} variant images`);
                          
                        } else {
                          toast({
                            title: "No products selected",
                            description: "Please select products first to view their variants",
                            variant: "destructive"
                          });
                        }
                      } else if (value === 'products') {
                        toast({
                          title: "Showing product images",
                          description: "Browse and select from main product images"
                        });
                        
                        if (selectedProducts.length > 0) {
                          // Extract images from selected products
                          const productImages: any[] = [];
                          let uniqueImageUrls = new Set<string>();
                          
                          selectedProducts.forEach(product => {
                            // Add main product image
                            if (product.image) {
                              const imageUrl = typeof product.image === 'string' ? product.image : (product.image.src || '');
                              if (imageUrl && !uniqueImageUrls.has(imageUrl)) {
                                uniqueImageUrls.add(imageUrl);
                                productImages.push({
                                  id: `product-${product.id}-main`,
                                  url: imageUrl,
                                  width: 500,
                                  height: 500,
                                  alt: product.title || 'Product image',
                                  src: {
                                    original: imageUrl,
                                    large: imageUrl,
                                    medium: imageUrl,
                                    small: imageUrl,
                                    thumbnail: imageUrl
                                  },
                                  selected: false,
                                  type: 'image'
                                });
                              }
                            }
                            
                            // Add additional product images
                            if (product.images && Array.isArray(product.images)) {
                              product.images.forEach((image, index) => {
                                // Handle different image object structures
                                const imageSrc = typeof image === 'string' ? image : 
                                  (image.src ? image.src : '');
                                const imageId = typeof image === 'string' ? `img-${index}` : 
                                  (image.id ? image.id : `img-${index}`);
                                
                                // Skip the main image (already added above) and empty URLs
                                if (imageSrc && (typeof product.image === 'string' || imageId !== (product.image?.id || ''))) {
                                  if (!uniqueImageUrls.has(imageSrc)) {
                                    uniqueImageUrls.add(imageSrc);
                                    productImages.push({
                                      id: `product-${product.id}-image-${imageId}-${index}`,
                                      url: imageSrc,
                                      width: 500,
                                      height: 500,
                                      alt: (typeof image === 'string' ? `${product.title} - Image ${index + 1}` : 
                                        (image.alt || `${product.title} - Image ${index + 1}`)),
                                      src: {
                                        original: imageSrc,
                                        large: imageSrc,
                                        medium: imageSrc,
                                        small: imageSrc,
                                        thumbnail: imageSrc
                                      },
                                      selected: false,
                                      type: 'image'
                                    });
                                  }
                                }
                              });
                            }
                          });
                          
                          setContentFiles(productImages);
                          console.log(`Loaded ${productImages.length} product images from ${selectedProducts.length} products`);
                          
                        } else {
                          toast({
                            title: "No products selected",
                            description: "Please select products first to view their images",
                            variant: "destructive"
                          });
                        }
                      } else if (value === 'media') {
                        toast({
                          title: "Loading media files",
                          description: "Fetching images from your Shopify store"
                        });
                        
                        // Fetch all media files from Shopify Media Library
                        setIsLoadingContentFiles(true);
                        
                        // Try fetching media files from the API
                        apiRequest({
                          url: '/api/admin/files',
                          method: 'GET'
                        }).then(response => {
                          if (response.success && response.files && response.files.length > 0) {
                            // Convert to standard format
                            const mediaFiles = response.files
                              .filter((file: any) => file && file.url)
                              .map((file: any) => ({
                                id: file.id || `media-${Math.random().toString(36).substring(7)}`,
                                url: file.url,
                                width: 500, // Standard width for display
                                height: 500, // Standard height for display
                                alt: file.alt || file.filename || 'Media File',
                                src: {
                                  original: file.url,
                                  large: file.url,
                                  medium: file.url,
                                  small: file.url,
                                  thumbnail: file.url
                                },
                                selected: false,
                                type: 'image'
                              }));
                            
                            setContentFiles(mediaFiles);
                            console.log(`Loaded ${mediaFiles.length} files from Shopify Media Library`);
                          } else {
                            // If no files found, fallback to product images
                            fallbackToProductImages();
                          }
                        }).catch(error => {
                          console.error('Error fetching media files:', error);
                          fallbackToProductImages();
                        }).finally(() => {
                          setIsLoadingContentFiles(false);
                        });
                        
                        // Function to fallback to product images if media library fails
                        function fallbackToProductImages() {
                          console.log('Falling back to product images');
                          
                          if (selectedProducts.length === 0) {
                            toast({
                              title: "No products selected",
                              description: "Please select products to view their images",
                              variant: "destructive"
                            });
                            setContentFiles([]);
                            return;
                          }
                          
                          // Extract product images
                          const productImages = [];
                          const uniqueUrls = new Set();
                          
                          selectedProducts.forEach(product => {
                            // Add main product image
                            if (product.image && product.image.src) {
                              if (!uniqueUrls.has(product.image.src)) {
                                uniqueUrls.add(product.image.src);
                                productImages.push({
                                  id: `product-${product.id}-main`,
                                  url: product.image.src,
                                  width: 500,
                                  height: 500,
                                  alt: product.title || 'Product image',
                                  src: {
                                    original: product.image.src,
                                    large: product.image.src,
                                    medium: product.image.src,
                                    small: product.image.src,
                                    thumbnail: product.image.src
                                  },
                                  selected: false,
                                  type: 'image'
                                });
                              }
                            }
                            
                            // Add variant images
                            if (product.images && Array.isArray(product.images)) {
                              product.images.forEach((image, index) => {
                                const imageUrl = typeof image === 'string' ? image : (image.src || '');
                                if (imageUrl && !uniqueUrls.has(imageUrl)) {
                                  uniqueUrls.add(imageUrl);
                                  productImages.push({
                                    id: `product-${product.id}-image-${index}`,
                                    url: imageUrl,
                                    width: 500,
                                    height: 500,
                                    alt: `${product.title} - Image ${index + 1}`,
                                    src: {
                                      original: imageUrl,
                                      large: imageUrl,
                                      medium: imageUrl,
                                      small: imageUrl,
                                      thumbnail: imageUrl
                                    },
                                    selected: false,
                                    type: 'image'
                                  });
                                }
                              });
                            }
                          });
                          
                          if (productImages.length > 0) {
                            setContentFiles(productImages);
                            toast({
                              title: "Product images loaded",
                              description: `Showing ${productImages.length} images from your products`
                            });
                          } else {
                            setContentFiles([]);
                            toast({
                              title: "No images found",
                              description: "Selected products don't have any images",
                              variant: "destructive"
                            });
                          }
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px] h-8">
                      <SelectValue placeholder="Image source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="products">Selected Product Images</SelectItem>
                      <SelectItem value="variants">Product Variant Images</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedProducts.length > 0 ? (
                <>
                  {/* Selected images preview */}
                  {(primaryImages.length > 0 || secondaryImages.length > 0) && (
                    <div className="mb-4 bg-slate-50 p-3 rounded-md border">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium">Your Selected Images</h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setPrimaryImages([]);
                            setSecondaryImages([]);
                            toast({
                              title: "Images cleared",
                              description: "All selected images have been removed"
                            });
                          }}
                          className="h-7 text-xs"
                        >
                          <Trash className="mr-1 h-3 w-3" />
                          Clear All
                        </Button>
                      </div>
                      
                      {primaryImages.length > 0 && (
                        <>
                          <h5 className="text-xs font-medium text-gray-500 mb-1">Featured/Primary Images:</h5>
                          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-3">
                            {primaryImages.map((img, index) => (
                              <div key={img.id} className="relative group">
                                <div className="relative aspect-square rounded-md overflow-hidden border-2 border-blue-500">
                                  <ShopifyImageViewer 
                                    src={img.src?.medium || img.url || ''} 
                                    alt={img.alt || "Selected image"} 
                                    className="w-full h-full"
                                  />
                                  <div className="absolute top-1 left-1 bg-blue-500 text-white px-1 py-0.5 rounded text-xs">
                                    {index === 0 ? 'Featured' : `Image ${index + 1}`}
                                  </div>
                                </div>
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    className="h-6 w-6" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPrimaryImages(prev => prev.filter(i => i.id !== img.id));
                                      toast({
                                        title: "Image removed",
                                        description: "Primary image has been removed",
                                      });
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      
                      {secondaryImages.length > 0 && (
                        <>
                          <h5 className="text-xs font-medium text-gray-500 mb-1">Secondary Content Images:</h5>
                          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {secondaryImages.map((img, index) => (
                              <div key={img.id} className="relative group">
                                <div className="relative aspect-square rounded-md overflow-hidden border-2 border-green-500">
                                  <ShopifyImageViewer 
                                    src={img.src?.medium || img.url || ''} 
                                    alt={img.alt || "Content image"} 
                                    className="w-full h-full"
                                  />
                                  <div className="absolute top-1 left-1 bg-green-500 text-white px-1 py-0.5 rounded text-xs">
                                    Content {index + 1}
                                  </div>
                                </div>
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    className="h-6 w-6" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSecondaryImages(prev => prev.filter(i => i.id !== img.id));
                                      toast({
                                        title: "Image removed",
                                        description: "Content image has been removed",
                                      });
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                
                  <div className="max-h-[400px] overflow-y-auto p-2">
                    {shopifyMediaType === 'products' && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {selectedProducts.map((product) => {
                          // Get image from product - try multiple sources
                          const productImage = product.image || 
                            (product.images && product.images.length > 0 ? product.images[0].src : null);
                            
                          if (!productImage) return null;
                          
                          // Check if this product image has already been added
                          const isAlreadySelected = primaryImages.some(img => 
                            img.id === `product-${product.id}` || img.url === productImage
                          );
                          
                          return (
                            <div 
                              key={product.id} 
                              className={`relative cursor-pointer rounded-md overflow-hidden border-2 hover:border-blue-400 transition-all ${isAlreadySelected ? 'border-green-500' : 'border-transparent'}`}
                            >
                              <div className="relative aspect-square">
                                <ShopifyImageViewer 
                                  src={productImage} 
                                  alt={product.title || 'Product image'} 
                                  className="w-full h-full bg-white"
                                />
                                {isAlreadySelected && (
                                  <div className="absolute top-1 right-1 bg-green-500 text-white p-1 rounded-full">
                                    <Check className="h-4 w-4" />
                                  </div>
                                )}
                                
                                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                                  <Button
                                    type="button"
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      // Skip if already selected
                                      if (isAlreadySelected) {
                                        toast({
                                          title: "Already selected",
                                          description: "This image is already in your selection"
                                        });
                                        return;
                                      }
                                      
                                      // Create a Pexels-compatible image object for the product image
                                      const imageForSelection: PexelsImage = {
                                        id: `product-${product.id}`,
                                        url: productImage || '',
                                        width: 500,
                                        height: 500,
                                        alt: product.title,
                                        src: {
                                          original: productImage || '',
                                          large: productImage || '',
                                          medium: productImage || '',
                                          small: productImage || '',
                                          thumbnail: productImage || '',
                                        }
                                      };
                                      
                                      // Add as featured image (first in array)
                                      setPrimaryImages(prev => [imageForSelection, ...prev]);
                                      
                                      toast({
                                        title: "Featured image added",
                                        description: "Product image added as featured image",
                                      });
                                    }}
                                    className="w-4/5 bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    Set as Featured
                                  </Button>
                                  
                                  <Button
                                    type="button"
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      // Create a Pexels-compatible image object for the product image
                                      const imageForSelection: PexelsImage = {
                                        id: `product-${product.id}-secondary`,
                                        url: productImage || '',
                                        width: 500,
                                        height: 500,
                                        alt: product.title,
                                        src: {
                                          original: productImage || '',
                                          large: productImage || '',
                                          medium: productImage || '',
                                          small: productImage || '',
                                          thumbnail: productImage || '',
                                        }
                                      };
                                      
                                      // Add to secondary images
                                      setSecondaryImages(prev => [...prev, imageForSelection]);
                                      
                                      toast({
                                        title: "Secondary image added",
                                        description: "Image added for use in content body",
                                      });
                                    }}
                                    className="w-4/5 bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <LayoutGrid className="mr-2 h-4 w-4" />
                                    Add to Content
                                  </Button>
                                </div>
                              </div>
                              <div className="bg-black bg-opacity-70 p-2">
                                <p className="text-white text-xs truncate">{product.title}</p>
                                <div className="flex justify-between items-center mt-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Create a Pexels-compatible image object for the product image
                                      const productImage: PexelsImage = {
                                        id: `product-${product.id}-secondary`,
                                        url: product.image || '',
                                        width: 500,
                                        height: 500,
                                        alt: product.title,
                                        src: {
                                          original: product.image || '',
                                          large: product.image || '',
                                          medium: product.image || '',
                                          small: product.image || '',
                                          thumbnail: product.image || '',
                                        }
                                      };
                                      
                                      // Add to secondary images
                                      setSecondaryImages(prev => [...prev, productImage]);
                                      
                                      toast({
                                        title: "Secondary image added",
                                        description: "Image added for use in content body",
                                      });
                                    }}
                                    className="h-6 px-2 text-white hover:bg-white hover:bg-opacity-20"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    <span className="text-xs">Add to Content</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {shopifyMediaType === 'variants' && (
                      <div className="space-y-6">
                        {selectedProducts.map(product => {
                          // Skip products with no variants or images
                          if (!product.variants || product.variants.length === 0) {
                            return null;
                          }
                          
                          return (
                            <div key={`variants-${product.id}`} className="space-y-2">
                              <h4 className="text-sm font-medium">{product.title} Variants</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {product.variants.map(variant => {
                                  // Skip variants without images
                                  if (!variant.image) return null;
                                  
                                  // Check if this variant image has already been added
                                  const isAlreadySelected = primaryImages.some(img => 
                                    img.id === `variant-${variant.id}` || img.url === variant.image
                                  );
                                  
                                  return (
                                    <div 
                                      key={variant.id} 
                                      className={`relative cursor-pointer rounded-md overflow-hidden border-2 hover:border-blue-400 transition-all ${isAlreadySelected ? 'border-green-500' : 'border-transparent'}`}
                                    >
                                      <div className="relative aspect-square">
                                        <ShopifyImageViewer 
                                          src={variant.image || ''} 
                                          alt={variant.title || 'Product variant'} 
                                          className="w-full h-full object-contain bg-white"
                                        />
                                        {isAlreadySelected && (
                                          <div className="absolute top-1 right-1 bg-green-500 text-white p-1 rounded-full">
                                            <Check className="h-4 w-4" />
                                          </div>
                                        )}
                                        
                                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                                          <div className="opacity-0 hover:opacity-100 transition-all flex gap-2">
                                            <Button
                                              type="button"
                                              variant="secondary"
                                              size="sm"
                                              onClick={() => {
                                                // Skip if already selected
                                                if (isAlreadySelected) {
                                                  toast({
                                                    title: "Already selected",
                                                    description: "This image is already in your selection"
                                                  });
                                                  return;
                                                }
                                                
                                                // Create a Pexels-compatible image object for the variant image
                                                const variantImage: PexelsImage = {
                                                  id: `variant-${variant.id}`,
                                                  url: variant.image || '',
                                                  width: 500,
                                                  height: 500,
                                                  alt: `${product.title} - ${variant.title}`,
                                                  src: {
                                                    original: variant.image || '',
                                                    large: variant.image || '',
                                                    medium: variant.image || '',
                                                    small: variant.image || '',
                                                    thumbnail: variant.image || '',
                                                  }
                                                };
                                                
                                                // Add as featured image (first in array)
                                                setPrimaryImages(prev => [variantImage, ...prev]);
                                                
                                                toast({
                                                  title: "Featured image added",
                                                  description: "Variant image added as featured image",
                                                });
                                              }}
                                              className="bg-white text-black hover:bg-gray-100"
                                            >
                                              <ImageIcon className="mr-1 h-3 w-3" />
                                              Set as Featured
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="bg-black bg-opacity-70 p-2">
                                        <p className="text-white text-xs truncate">{variant.title}</p>
                                        <div className="flex justify-between items-center mt-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              // Create a Pexels-compatible image object for the variant image
                                              const variantImage: PexelsImage = {
                                                id: `variant-${variant.id}-secondary`,
                                                url: variant.image || '',
                                                width: 500,
                                                height: 500,
                                                alt: `${product.title} - ${variant.title}`,
                                                src: {
                                                  original: variant.image || '',
                                                  large: variant.image || '',
                                                  medium: variant.image || '',
                                                  small: variant.image || '',
                                                  thumbnail: variant.image || '',
                                                }
                                              };
                                              
                                              // Add to secondary images
                                              setSecondaryImages(prev => [...prev, variantImage]);
                                              
                                              toast({
                                                title: "Secondary image added",
                                                description: "Image added for use in content body",
                                              });
                                            }}
                                            className="h-6 px-2 text-white hover:bg-white hover:bg-opacity-20"
                                          >
                                            <Plus className="h-3 w-3 mr-1" />
                                            <span className="text-xs">Add to Content</span>
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {selectedProducts.every(p => !p.variants || p.variants.length === 0) && (
                          <div className="text-center py-8">
                            <ShoppingBag className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 mb-2">No product variants with images found</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShopifyMediaType('products')}
                            >
                              <ArrowLeft className="mr-2 h-3 w-3" />
                              Switch to Product Images
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {shopifyMediaType === 'media' && (
                      <>
                        {isLoadingContentFiles ? (
                          <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <span className="ml-2">Loading content files...</span>
                          </div>
                        ) : contentFiles.length > 0 ? (
                          <div>
                            <div className="pb-3 mb-3 border-b border-gray-200">
                              <div className="flex items-center">
                                <h4 className="text-sm font-medium flex items-center">
                                  <Store className="h-4 w-4 mr-2 text-blue-500" />
                                  Product & Media Images
                                </h4>
                                <Badge variant="outline" className="ml-3">{contentFiles.length} images</Badge>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="ml-auto"
                                  onClick={fetchShopifyFiles}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Refresh
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Select product and media images from your Shopify store
                              </p>
                            </div>
                          
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {contentFiles.map((file) => {
                                // Check if already selected
                                const isPrimarySelected = primaryImages.some(img => 
                                  img.id === file.id || img.url === file.url
                                );
                                const isSecondarySelected = secondaryImages.some(img => 
                                  img.id === `${file.id}-secondary` || img.url === file.url
                                );
                                
                                let borderClass = 'border-gray-200';
                                if (isPrimarySelected) borderClass = 'border-blue-500';
                                if (isSecondarySelected) borderClass = 'border-green-500';
                                
                                return (
                                  <div 
                                    key={file.id} 
                                    className={`relative rounded-md overflow-hidden border-2 ${borderClass} hover:shadow-md transition-all`}
                                  >
                                    {isPrimarySelected && (
                                      <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs z-10 shadow-sm">
                                        Primary
                                      </div>
                                    )}
                                    {isSecondarySelected && (
                                      <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs z-10 shadow-sm">
                                        Secondary
                                      </div>
                                    )}
                                    
                                    <div className="relative aspect-square">
                                      <ShopifyImageViewer 
                                        src={file.url} 
                                        alt={file.alt || file.filename || "Shopify image"} 
                                        className="w-full h-full object-contain bg-white"
                                      />
                                      
                                      {/* Action buttons overlay */}
                                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-all flex items-center justify-center gap-2 p-3">
                                        <Button 
                                          size="sm" 
                                          variant={isPrimarySelected ? "default" : "outline"}
                                          className={cn(
                                            "bg-blue-500 hover:bg-blue-600 text-white",
                                            isPrimarySelected ? "opacity-100" : "opacity-90 hover:opacity-100"
                                          )}
                                          onClick={() => {
                                            // Create a Pexels-compatible image object
                                            const imageForSelection: PexelsImage = {
                                              id: file.id,
                                              url: file.url,
                                              width: 800,
                                              height: 800,
                                              alt: file.alt || file.name,
                                              src: {
                                                original: file.url,
                                                large: file.url,
                                                medium: file.url,
                                                small: file.url,
                                                thumbnail: file.url,
                                              }
                                            };
                                            
                                            // Add to primary images (featured)
                                            setPrimaryImages(prev => [imageForSelection, ...prev.filter(img => img.id !== file.id)]);
                                            
                                            // If it was in secondary images, remove it from there
                                            if (isSecondarySelected) {
                                              setSecondaryImages(prev => prev.filter(img => 
                                                img.id !== `${file.id}-secondary` && img.url !== file.url
                                              ));
                                            }
                                            
                                            toast({
                                              title: "Primary image selected",
                                              description: "Image will appear as the featured image"
                                            });
                                          }}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Primary
                                        </Button>
                                        
                                        <Button 
                                          size="sm" 
                                          variant={isSecondarySelected ? "default" : "outline"}
                                          className={cn(
                                            "bg-green-500 hover:bg-green-600 text-white",
                                            isSecondarySelected ? "opacity-100" : "opacity-90 hover:opacity-100"
                                          )}
                                          onClick={() => {
                                            // Create a Pexels-compatible image object
                                            const imageForSelection: PexelsImage = {
                                              id: `${file.id}-secondary`,
                                              url: file.url,
                                              width: 800,
                                              height: 800,
                                              alt: file.alt || file.filename || "Media image",
                                              src: {
                                                original: file.url,
                                                large: file.url,
                                                medium: file.url,
                                                small: file.url,
                                                thumbnail: file.url,
                                              }
                                            };
                                            
                                            // Add to secondary images (content)
                                            setSecondaryImages(prev => [...prev, imageForSelection]);
                                            
                                            // Update selectedMediaContent state immediately
                                            setSelectedMediaContent(prev => ({
                                              ...prev,
                                              secondaryImages: [...prev.secondaryImages, {
                                                id: imageForSelection.id,
                                                url: imageForSelection.url,
                                                alt: imageForSelection.alt || '',
                                                width: imageForSelection.width || 0,
                                                height: imageForSelection.height || 0,
                                                source: imageForSelection.source || 'uploaded'
                                              }]
                                            }));
                                            
                                            // If it was in primary images, remove it from there
                                            if (isPrimarySelected) {
                                              setPrimaryImages(prev => prev.filter(img => 
                                                img.id !== file.id && img.url !== file.url
                                              ));
                                            }
                                            
                                            toast({
                                              title: "Secondary image added",
                                              description: "Image will appear in your content body"
                                            });
                                          }}
                                          disabled={isSecondarySelected}
                                        >
                                          <PlusCircle className="h-4 w-4 mr-1" />
                                          Secondary
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {/* Image name/label */}
                                    <div className="p-2 bg-black bg-opacity-75">
                                      <p className="text-white text-xs truncate">{file.filename || "Shopify Image"}</p>
                                      {file.source && (
                                        <p className="text-gray-400 text-xs truncate mt-0.5">
                                          {file.source === 'product_image' ? 'Product Image' : 'Media Library'}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <FileImage className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                            <p className="text-gray-500 mb-2">No media files found</p>
                            <p className="text-xs text-gray-400 max-w-md mx-auto mb-4">
                              Your Shopify Media Library appears to be empty. You can upload images directly in Shopify or select from Product Images instead.
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={fetchShopifyFiles}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Refresh Content Files
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 mb-2">No products selected yet</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowImageDialog(false);
                      setWorkflowStep('product');
                    }}
                  >
                    <ArrowLeft className="mr-2 h-3 w-3" />
                    Select Products First
                  </Button>
                </div>
              )}
              
              {selectedProducts.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                  <div className="flex">
                    <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-700 mb-1 font-medium">Image Selection Tips</p>
                      <p className="text-xs text-blue-600">
                        • Use "Set as Featured" for your main product image<br />
                        • Add additional images to the content body with "Add to Content"<br />
                        • For best results, include emotionally compelling images with people using your products
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {imageSource === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-md p-8 text-center cursor-pointer"
                onClick={() => {
                  document.getElementById('image-upload')?.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const files = e.dataTransfer.files;
                  if (files && files.length > 0) {
                    const file = files[0];
                    if (file.type.startsWith('image/')) {
                      // Create a URL for the image file
                      const localUrl = URL.createObjectURL(file);
                      
                      // Create a Pexels-compatible image object
                      const uploadedImage: PexelsImage = {
                        id: `upload-${new Date().getTime()}`,
                        url: localUrl,
                        width: 600,
                        height: 400,
                        alt: file.name,
                        src: {
                          original: localUrl,
                          large: localUrl,
                          medium: localUrl,
                          small: localUrl,
                          thumbnail: localUrl,
                        }
                      };
                      
                      // Add to appropriate images array
                      if (workflowStep === 'media') {
                        setPrimaryImages(prev => [...prev, uploadedImage]);
                      } else {
                        setSecondaryImages(prev => [...prev, uploadedImage]);
                      }
                      
                      toast({
                        title: "Image uploaded",
                        description: "Your image has been added to the selected images",
                      });
                      
                      // Close dialog
                      setShowImageDialog(false);
                    } else {
                      toast({
                        title: "Invalid file type",
                        description: "Please upload an image file",
                        variant: "destructive"
                      });
                    }
                  }
                }}
              >
                <Upload className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600 mb-4">
                  Drag and drop image files here, or click to select files
                </p>
                <Input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  id="image-upload"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      const file = files[0];
                      
                      // Create a URL for the image file
                      const localUrl = URL.createObjectURL(file);
                      
                      // Create a Pexels-compatible image object
                      const uploadedImage: PexelsImage = {
                        id: `upload-${new Date().getTime()}`,
                        url: localUrl,
                        width: 600,
                        height: 400,
                        alt: file.name,
                        src: {
                          original: localUrl,
                          large: localUrl,
                          medium: localUrl,
                          small: localUrl,
                          thumbnail: localUrl,
                        }
                      };
                      
                      // Add to appropriate images array
                      if (workflowStep === 'media') {
                        setPrimaryImages(prev => [...prev, uploadedImage]);
                      } else {
                        setSecondaryImages(prev => [...prev, uploadedImage]);
                      }
                      
                      toast({
                        title: "Image uploaded successfully",
                        description: "Your image has been added to the selected images",
                      });
                      
                      // Close dialog
                      setShowImageDialog(false);
                    }
                  }}
                />
                <Button 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('image-upload')?.click();
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Select Image
                </Button>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                <div className="flex">
                  <Info className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-700 mb-1 font-medium">About Image Uploads</p>
                    <p className="text-xs text-yellow-600">
                      Make sure you have the rights to use any images you upload. For best results,
                      use high-quality images at least 1200×800 pixels in size.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setShowImageDialog(false)}>
              Cancel
            </Button>
            
            <Button
              type="button"
              onClick={() => {
                  // Add selected images to the appropriate collection
                  const selectedPexelsImages = searchedImages.filter(img => img.selected);
                  
                  if (selectedPexelsImages.length === 0) {
                    toast({
                      title: "No Images Selected",
                      description: "Please select at least one image",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // Process the selected images, maintaining their primary/secondary status
                  const primarySelected = selectedPexelsImages.filter(img => img.isPrimary);
                  const secondarySelected = selectedPexelsImages.filter(img => !img.isPrimary);
                  
                  // Add to appropriate collections based on their selected status
                  if (primarySelected.length > 0) {
                    setPrimaryImages(prev => [...prev, ...primarySelected]);
                  }
                  
                  if (secondarySelected.length > 0) {
                    setSecondaryImages(prev => [...prev, ...secondarySelected]);
                  }
                  
                  // If no isPrimary flag is set but we're in media step, treat all as primary
                  if (primarySelected.length === 0 && secondarySelected.length === 0) {
                    if (workflowStep === 'media') {
                      setPrimaryImages(prev => [...prev, ...selectedPexelsImages]);
                    } else {
                      setSecondaryImages(prev => [...prev, ...selectedPexelsImages]);
                    }
                  }
                  
                  // Clear selections and close dialog
                  setSearchedImages(searchedImages.map(img => ({ ...img, selected: false })));
                  setShowImageDialog(false);
                  
                  toast({
                    title: "Images Added",
                    description: `Added ${selectedPexelsImages.length} image${selectedPexelsImages.length === 1 ? '' : 's'} to your content`,
                  });
                }}
                disabled={searchedImages.filter(img => img.selected).length === 0}
              >
                Add Selected Items
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add the standalone project creation dialog that shows automatically */}
      <ProjectCreationDialog />
      {/* Choose Media Dialog - New improved component */}
      <ChooseMediaDialog
        open={showChooseMediaDialog && !showImageDialog} 
        onOpenChange={(open) => {
          // Ensure only one dialog is open at a time
          if (open && showImageDialog) {
            setShowImageDialog(false); // Close the other dialog first
            setTimeout(() => setShowChooseMediaDialog(open), 300); // Then open this one after a short delay
          } else {
            setShowChooseMediaDialog(open);
          }
        }}
        onImagesSelected={(images) => {
          // When user confirms selected images
          if (images.length > 0) {
            // Create a standardized image format that works for both Shopify and Pexels images
            const standardizedImages = images.map(img => {
              // Create a common format that has all necessary properties
              const standardImage = {
                id: img.id,
                url: img.url,
                width: 500, // default size if not available
                height: 500,
                alt: img.alt || img.title || 'Image',
                // Ensure src is properly formatted for our components
                src: {
                  original: img.url,
                  large: img.url,
                  medium: img.url,
                  small: img.url,
                  thumbnail: img.url,
                },
                // Keep track of the original source
                source: img.source || 'shopify',
                // For type safety - let's add these fields to make it compatible with PexelsImage
                selected: false,
                type: 'image',
                // Store the primary/secondary designation from the ChooseMediaDialog
                isPrimary: img.isPrimary
              };
              return standardImage;
            });
            
            try {
              // Sort images into primary and secondary based on the isPrimary flag
              const primaryImgs = standardizedImages.filter(img => img.isPrimary === true);
              const secondaryImgs = standardizedImages.filter(img => img.isPrimary === false);
              
              // Process primary images if any exist
              if (primaryImgs.length > 0) {
                const safePrimaryImages = primaryImgs.map(img => ({
                  ...img,
                  selected: false,
                  type: 'image',
                  src: {
                    original: img.url,
                    large: img.url,
                    medium: img.url,
                    small: img.url,
                    thumbnail: img.url
                  }
                }));
                setPrimaryImages(prev => [...prev, ...safePrimaryImages]);
                toast({
                  title: "Featured images added",
                  description: `${primaryImgs.length} featured image${primaryImgs.length === 1 ? '' : 's'} added successfully`
                });
              }
              
              // Process secondary images if any exist
              if (secondaryImgs.length > 0) {
                const safeSecondaryImages = secondaryImgs.map(img => ({
                  ...img,
                  selected: false,
                  type: 'image',
                  src: {
                    original: img.url,
                    large: img.url,
                    medium: img.url,
                    small: img.url,
                    thumbnail: img.url
                  }
                }));
                setSecondaryImages(prev => [...prev, ...safeSecondaryImages]);
                
                // Update selectedMediaContent state immediately
                setSelectedMediaContent(prev => ({
                  ...prev,
                  secondaryImages: [...prev.secondaryImages, ...safeSecondaryImages.map(img => ({
                    id: img.id,
                    url: img.url,
                    alt: img.alt || '',
                    width: img.width || 0,
                    height: img.height || 0,
                    source: img.source || 'pexels'
                  }))]
                }));
                
                toast({
                  title: "Content images added",
                  description: `${secondaryImgs.length} content image${secondaryImgs.length === 1 ? '' : 's'} added successfully`
                });
              }
              
              // If no isPrimary designation was made, use the active tab as before
              if (primaryImgs.length === 0 && secondaryImgs.length === 0) {
                // Fallback to the old method - add to the appropriate collection based on active tab
                if (imageTab === 'primary') {
                  const safeImages = standardizedImages.map(img => ({
                    ...img,
                    selected: false,
                    type: 'image',
                    src: {
                      original: img.url,
                      large: img.url,
                      medium: img.url,
                      small: img.url,
                      thumbnail: img.url
                    }
                  }));
                  setPrimaryImages(prev => [...prev, ...safeImages]);
                  toast({
                    title: "Featured images added",
                    description: `${images.length} featured image${images.length === 1 ? '' : 's'} added successfully`
                  });
                } else {
                  const safeImages = standardizedImages.map(img => ({
                    ...img,
                    selected: false,
                    type: 'image',
                    src: {
                      original: img.url,
                      large: img.url,
                      medium: img.url,
                      small: img.url,
                      thumbnail: img.url
                    }
                  }));
                  setSecondaryImages(prev => [...prev, ...safeImages]);
                  
                  // Update selectedMediaContent state immediately
                  setSelectedMediaContent(prev => ({
                    ...prev,
                    secondaryImages: [...prev.secondaryImages, ...safeImages.map(img => ({
                      id: img.id,
                      url: img.url,
                      alt: img.alt || '',
                      width: img.width || 0,
                      height: img.height || 0,
                      source: img.source || 'pexels'
                    }))]
                  }));
                  
                  toast({
                    title: "Content images added",
                    description: `${images.length} content image${images.length === 1 ? '' : 's'} added successfully`
                  });
                }
              }
            } catch (error) {
              console.error("Error adding images:", error);
              toast({
                title: "Error adding images",
                description: "There was a problem adding the selected images. Please try again.",
                variant: "destructive"
              });
            }
          }
        }}
        initialSelectedImages={imageTab === 'primary' ? primaryImages : secondaryImages}
        maxImages={10}
        allowMultiple={true}
        title={imageTab === 'primary' ? "Choose Featured Images" : "Choose Content Images"}
        description={imageTab === 'primary' 
          ? "Select emotionally compelling images for the top of your content" 
          : "Select product images to appear throughout your article body"}
      />
    </div>
  );
}
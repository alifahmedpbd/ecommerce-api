
from django.urls import path
from . import views 


urlpatterns = [
        path('products/search/', views.product_search, name='product_search'),

    path('products/', views.product_list, name='product_list'),
    path('products/<slug:slug>/', views.product_detail, name='product_detail'),

    path('categories/', views.category_list, name='category_list'),
    path('categories/<slug:slug>/', views.category_detail, name='category_detail'),

    path('cart/add/', views.add_to_cart, name='add_to_cart'),
    path('cart/update/', views.update_cart_item, name='update_cart_item'),

    path('reviews/add/', views.add_review, name='add_review'),
    path('reviews/update/<int:pk>/', views.update_review, name='update_review'),
    path('reviews/delete/<int:pk>/', views.delete_review, name='delete_review'),
    path('cartitems/delete/<int:pk>/', views.delete_cartitem, name='delete_cartitem'),

    path('wishlist/add/', views.add_to_wishlist, name='add_to_wishlist'),
    path('checkout/', views.create_checkout_session, name='create_checkout_session'),
    path('webhook/stripe/', views.stripe_webhook, name='stripe_webhook'),

    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('orders/', views.OrderHistoryView.as_view(), name='order_history'),

    path('wishlist/', views.WishlistListView.as_view(), name='wishlist_list'),
    path('profile/update/', views.UserProfileUpdateView.as_view(), name='profile_update'),

    path('my-reviews/', views.CustomerReviewsView.as_view(), name='customer_reviews'),

    path('staff/orders/', views.StaffOrderListView.as_view(), name='staff-orders'),
    path('staff/orders/<int:pk>/status/', views.StaffOrderStatusUpdateView.as_view(), name='staff-order-status-update'),

    # Admin and Staff Dashboard
    path('dashboard/overview/', views.AdminDashboardOverviewView.as_view(), name='dashboard-overview'),
    path('dashboard/low-stock/', views.AdminLowStockProductsView.as_view(), name='dashboard-low-stock'),

# Admin Product CRUD
    path('admin/products/', views.AdminProductListCreateView.as_view(), name='admin-products'),
    path('admin/products/<int:pk>/', views.AdminProductDetailView.as_view(), name='admin-product-detail'),

# Admin Category CRUD
    path('admin/categories/', views.AdminCategoryListCreateView.as_view(), name='admin-categories'),
    path('admin/categories/<int:pk>/', views.AdminCategoryDetailView.as_view(), name='admin-category-detail'),

# Staff Management
    path('admin/staff/', views.AdminStaffListCreateView.as_view(), name='admin-staff'),
    path('admin/staff/<int:pk>/role/', views.AdminStaffRoleUpdateView.as_view(), name='admin-staff-role'),

# Reviews Management
    path('admin/reviews/', views.AdminReviewListView.as_view(), name='admin-reviews'),
    path('admin/reviews/<int:pk>/', views.AdminReviewDeleteView.as_view(), name='admin-review-delete'),
    path('dashboard/analytics/', views.AdminAnalyticsView.as_view(), name='dashboard-analytics'),

    path('cart/<str:cart_code>/', views.get_cart, name='get_cart'),
    
]

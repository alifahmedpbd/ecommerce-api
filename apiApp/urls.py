
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

]

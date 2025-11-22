# Cart Not Working - Debug Steps

## Quick Test

Open browser console on gptees.app and run:

```javascript
// Test 1: Check if localStorage works
localStorage.setItem('test', 'works');
console.log(localStorage.getItem('test')); // Should print "works"

// Test 2: Check current cart
console.log(localStorage.getItem('gptees_cart'));

// Test 3: Manually add item to cart
localStorage.setItem('gptees_cart', JSON.stringify([
  {
    productId: 'test123',
    productName: 'Test Product',
    size: 'M',
    color: 'Black',
    tier: 'BASIC',
    quantity: 1,
    basePrice: 24.99,
    tierPrice: 24.99,
    imageUrl: null
  }
]));

// Test 4: Refresh page - cart badge should show (1)
```

## What to Check

### 1. Does the Product Modal Open?
- Click on a product
- Does the modal appear?
- Can you select size, color, tier?
- Does "Add to Cart" button exist?

### 2. Check Browser Console
When you click "Add to Cart":
- Are there any errors in console?
- Does the modal close?
- Does cart badge update?

### 3. Check Network Tab
- Open DevTools → Network tab
- Click "Add to Cart"
- Are there any API calls? (There shouldn't be - cart is localStorage only)

### 4. Check if Cart Hook is Loading
Add this to browser console:
```javascript
// Check if cart is loaded
const cart = JSON.parse(localStorage.getItem('gptees_cart') || '[]');
console.log('Cart items:', cart);
console.log('Cart count:', cart.reduce((sum, item) => sum + item.quantity, 0));
```

## Common Issues

### Issue 1: Modal Not Opening
**Symptom:** Click product, nothing happens
**Fix:** Check browser console for errors

### Issue 2: Modal Opens But Button Doesn't Work
**Symptom:** Modal appears, but clicking "Add to Cart" does nothing
**Possible causes:**
- JavaScript error
- Button disabled
- onClick handler not firing

### Issue 3: Item Added But Badge Doesn't Update
**Symptom:** Item in localStorage but badge shows 0
**Possible causes:**
- Cart hook not re-rendering
- Badge component not using cart hook

### Issue 4: LocalStorage Blocked
**Symptom:** Nothing works
**Fix:** Check if browser has localStorage disabled or blocked

## Debug Commands

```javascript
// Clear cart
localStorage.removeItem('gptees_cart');

// View cart
console.log(JSON.parse(localStorage.getItem('gptees_cart') || '[]'));

// Add test item
localStorage.setItem('gptees_cart', JSON.stringify([{
  productId: 'test',
  productName: 'Test',
  size: 'M',
  color: 'Black',
  tier: 'BASIC',
  quantity: 1,
  basePrice: 24.99,
  tierPrice: 24.99,
  imageUrl: null
}]));

// Check cart count
const cart = JSON.parse(localStorage.getItem('gptees_cart') || '[]');
console.log('Total items:', cart.reduce((sum, item) => sum + item.quantity, 0));
```

## What to Tell Me

1. **Does the modal open?** Yes/No
2. **Any console errors?** Copy/paste them
3. **Does the modal close after clicking "Add to Cart"?** Yes/No
4. **Does the cart badge update?** Yes/No
5. **What does `localStorage.getItem('gptees_cart')` show?** Copy/paste

This will help me pinpoint exactly where the issue is!

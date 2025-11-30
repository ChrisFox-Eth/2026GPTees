/**

 * @module pages/OrderDetailPage

 * @description Order detail page with designs and shipping info

 * @since 2025-11-22

 */



import { useEffect, useState } from 'react';

import { Link, useParams } from 'react-router-dom';

import { useAuth } from '@clerk/clerk-react';

import { apiGet } from '../utils/api';

import { Button } from '@components/Button';

import { trackEvent } from '@utils/analytics';



interface OrderItem {

  id: string;

  size: string;

  color: string;

  quantity: number;

  unitPrice: number;

  product: {

    name: string;

  };

}



interface Design {

  id: string;

  imageUrl: string;

  prompt: string;

  approvalStatus: boolean;

  status: string;

}



interface Address {

  name: string;

  address1: string;

  address2?: string | null;

  city: string;

  state?: string | null;

  zip: string;

  country: string;

  phone?: string | null;

}



interface Order {

  id: string;

  orderNumber: string;

  status: string;

  fulfillmentStatus?: string | null;

  totalAmount: number;

  designTier: string;

  designsGenerated: number;

  maxDesigns: number;

  createdAt: string;

  items: OrderItem[];

  designs: Design[];

  address?: Address | null;

  trackingNumber?: string | null;

  promoCode?: {
    code: string;
    type: string;
    percentOff?: number | null;
    productTier?: string | null;
  } | null;

}



function OrderDetailContent(): JSX.Element {

  const { id } = useParams<{ id: string }>();

  const { getToken, isLoaded, isSignedIn } = useAuth();



  const [order, setOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);



  const formatStatus = (status?: string | null) =>

    status ? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Unknown';



  useEffect(() => {

    if (id && isLoaded && isSignedIn) {

      fetchOrder();

    }

  }, [id, isLoaded, isSignedIn]);



  const fetchOrder = async () => {

    try {

      setLoading(true);

      const token = await getToken();

      if (!token) {

        setError('Authentication required. Please sign in again.');

        return;

      }

      const response = await apiGet(`/api/orders/${id}`, token);

      setOrder(response.data);

      setError(null);

      trackEvent('account.order_detail.loaded', {

        order_id: id,

        status: response.data?.status,

        design_count: response.data?.designs?.length ?? 0,

      });

    } catch (err: any) {

      console.error('Error loading order', err);

      setError(err.message || 'Failed to load order');

      trackEvent('account.order_detail.error', {

        order_id: id,

        message: err?.message || 'unknown',

      });

    } finally {

      setLoading(false);

    }

  };



  if (!id) {

    return (

      <div className="container-max py-12">

        <p className="text-gray-700 dark:text-gray-200">Order ID is missing.</p>

      </div>

    );

  }



  if (loading) {

    return (

      <div className="container-max py-12 flex justify-center">

        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>

      </div>

    );

  }



  if (error || !order) {

    return (

      <div className="container-max py-12">

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4">

          <p className="text-red-800 dark:text-red-300">{error || 'Order not found'}</p>

        </div>

      </div>

    );

  }



  return (

    <div className="container-max py-8 space-y-6">

      <div className="flex items-center justify-between gap-4">

        <div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{order.orderNumber}</h1>

          <div className="text-sm text-gray-600 dark:text-gray-400 space-x-2">

            <span>{new Date(order.createdAt).toLocaleString()}</span>

            <span>|</span>

            <span>Order: {formatStatus(order.status)}</span>

            {order.fulfillmentStatus && (

              <>

                <span>|</span>

                <span>Fulfillment: {formatStatus(order.fulfillmentStatus)}</span>

              </>

            )}

          </div>

        </div>

        <div className="flex gap-3">

          <Link to="/account">

            <Button variant="secondary" size="sm">

              Back to Orders

            </Button>

          </Link>

          {order.status === 'PAID' && order.designsGenerated < order.maxDesigns && (

            <Link to={`/design?orderId=${order.id}`}>

              <Button variant="primary" size="sm">

                Generate Design

              </Button>

            </Link>

          )}

        </div>

      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-4">

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Items</h2>

            <div className="space-y-3">

              {order.items.map((item) => (

                <div key={item.id} className="flex justify-between">

                  <div className="text-gray-800 dark:text-gray-200">

                    <p className="font-semibold">{item.product.name}</p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">

                      {item.size} | {item.color} | Qty {item.quantity}

                    </p>

                  </div>

                  <div className="text-gray-900 dark:text-white font-semibold">

                    ${(Number(item.unitPrice) * item.quantity).toFixed(2)}

                  </div>

                </div>

              ))}

            </div>

          </div>



          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">

            <div className="flex items-center justify-between mb-3">

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Designs</h2>

              {order.designs.length === 0 && (

                <span className="text-sm text-gray-600 dark:text-gray-400">No designs yet</span>

              )}

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              {order.designs.map((design) => (

                <div

                  key={design.id}

                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"

                >

                  <div className="bg-gray-100 dark:bg-gray-900">

                    <img src={design.imageUrl} alt={design.prompt} className="w-full h-48 object-contain" />

                  </div>

                  <div className="p-3 space-y-1">

                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{design.prompt}</p>

                    <p className="text-xs text-gray-500 dark:text-gray-500">

                      {design.approvalStatus ? 'Approved' : design.status}

                    </p>

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>



        <div className="space-y-4">

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Summary</h2>

            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-1">

              <span>Tier</span>

              <span>{order.designTier}</span>

            </div>

            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-1">

              <span>Designs</span>

              <span>

                {order.designsGenerated}/{order.maxDesigns === 9999 ? 'unlimited' : order.maxDesigns}

              </span>

            </div>

            {order.promoCode && (

              <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-1">

                <span>Code</span>

                <span>

                  {order.promoCode.code} (

                  {order.promoCode.type === 'FREE_PRODUCT'

                    ? `Free ${order.promoCode.productTier || 'tee'}`

                    : `${order.promoCode.percentOff || 0}% off`}

                  )

                </span>

              </div>

            )}

            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">

              <span>Total</span>

              <span>${Number(order.totalAmount).toFixed(2)}</span>

            </div>

          </div>



          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Shipping</h2>

            {order.address ? (

              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">

                <p>{order.address.name}</p>

                <p>{order.address.address1}</p>

                {order.address.address2 && <p>{order.address.address2}</p>}

                <p>

                  {order.address.city}, {order.address.state} {order.address.zip}

                </p>

                <p>{order.address.country}</p>

                {order.address.phone && <p>Phone: {order.address.phone}</p>}

              </div>

            ) : (

              <p className="text-sm text-gray-600 dark:text-gray-400">No shipping address on file.</p>

            )}

          </div>



          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tracking</h2>

            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">

              <p>Status: {formatStatus(order.fulfillmentStatus || order.status)}</p>

              {order.trackingNumber ? (

                <p>
                  Tracking #:{' '}
                  <a
                    href={`https://parcelsapp.com/en/tracking/${encodeURIComponent(order.trackingNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {order.trackingNumber}
                  </a>
                </p>

              ) : (
                <p>Tracking #: Not yet available</p>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}



export default function OrderDetailPage(): JSX.Element {

  return <OrderDetailContent />;

}







/**
 * @module pages/RefundsPage
 * @description Refund Policy page
 * @since 2025-11-21
 */

/**
 * @component
 * @description Refund Policy page detailing cancellation, return, and refund procedures including eligibility requirements and processing timelines.
 *
 * @returns {JSX.Element} The rendered refund policy page
 *
 * @example
 * // Used in App.tsx routing
 * <Route path="/refunds" element={<RefundsPage />} />
 */
export default function RefundsPage(): JSX.Element {
  return (
    <div className="container-max py-12">
      <div className="prose prose-lg dark:prose-invert mx-auto max-w-4xl">
        <h1>Refund Policy</h1>
        <p className="text-gray-600 dark:text-gray-400">Last updated: November 2025</p>

        <h2>1. Overview</h2>
        <p>
          We want you to be completely satisfied with your custom-designed apparel. This policy
          outlines our refund, return, and cancellation procedures.
        </p>

        <h2>2. Order Cancellation</h2>
        <p>
          Once you approve a design, your order is immediately submitted to Printful for production.
          Cancellations at this stage are not guaranteed but may be possible if production has not
          yet started. A $10 processing fee may apply.
        </p>

        <h2>3. Returns and Refunds</h2>
        <p>
          If your item arrives damaged, defective, or significantly different from your approved
          design, we will provide a full refund or replacement at no additional cost.
        </p>
        <p>
          <strong>Requirements:</strong>
        </p>
        <ul>
          <li>Contact us within 14 days of delivery</li>
          <li>Provide photos of the defect or damage</li>
          <li>Item must be unworn and unwashed</li>
        </ul>

        <p>
          We strongly encourage using all available design options (especially on Limitless tier)
          before approving. Once approved and printed, we cannot offer refunds for design preference
          changes.
        </p>
        <p>
          <strong>Exception:</strong> If the printed design significantly differs from your approved
          design preview, contact us for resolution.
        </p>

        <p>
          If we shipped the wrong size or product due to our error, we will provide a replacement or
          full refund. If you ordered the wrong size, we can offer a replacement at a discounted
          rate (you pay shipping + production costs).
        </p>

        <h2>Return Process</h2>
        <p>To initiate a return:</p>
        <ol>
          <li>
            Email <a href="mailto:team@gptees.app">team@gptees.app</a> with your order number
          </li>
          <li>Provide photos and description of the issue</li>
          <li>Wait for return authorization and instructions</li>
          <li>Ship item back using provided address (if required)</li>
          <li>Refund processed within 5-7 business days of receipt</li>
        </ol>

        <h2>Refund Method</h2>
        <p>
          Refunds are issued to the original payment method used at checkout. Processing time varies
          by payment provider but typically takes 5-10 business days.
        </p>

        <h2>Non-Refundable Items</h2>
        <p>The following are not eligible for refunds:</p>
        <ul>
          <li>Items worn, washed, or altered after delivery</li>
          <li>Designs you approved that were printed accurately</li>
          <li>Items returned without authorization</li>
          <li>Items damaged after delivery due to misuse</li>
          <li>Design tier fees (non-refundable once used)</li>
        </ul>

        <h2>Shipping Costs</h2>
        <p>
          Original shipping costs are non-refundable unless the return is due to our error (defect,
          damage, or wrong item). Return shipping costs are the customer's responsibility unless the
          return is due to our error.
        </p>

        <h2>Processing Time</h2>
        <ul>
          <li>
            <strong>Refund approval:</strong> 1-3 business days after receiving return
          </li>
          <li>
            <strong>Refund to account:</strong> 5-10 business days (varies by bank)
          </li>
          <li>
            <strong>Replacement orders:</strong> 2-5 business days production + shipping
          </li>
        </ul>

        <h2>International Orders</h2>
        <p>
          International customers are responsible for any customs fees or import taxes. These fees
          are non-refundable. Returns from international addresses may take longer to process.
        </p>

        <h2>Lost or Stolen Packages</h2>
        <p>
          We are not responsible for packages marked as delivered by the carrier. However, we will
          work with you to file a claim with the shipping carrier. Consider purchasing shipping
          insurance for high-value orders.
        </p>

        <h2>Design Tier Credits</h2>
        <p>
          <strong>Basic Tier:</strong> The single design option is non-refundable once used.
          <br />
          <strong>Limitless Tier:</strong> If you cancel before approving any design, you receive a
          full refund. After approval, the Limitless tier fee is non-refundable.
        </p>

        <h2>Contact for Questions</h2>
        <p>
          If you have questions about our refund policy or need assistance with a return, please
          contact: <a href="mailto:team@gptees.app">team@gptees.app</a>
        </p>
      </div>
    </div>
  );
}

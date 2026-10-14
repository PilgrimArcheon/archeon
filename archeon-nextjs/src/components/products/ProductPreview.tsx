import type { ProductSlug } from "@/data/products";
import styles from "@/app/products/products.module.css";

/** Explicitly illustrative UI previews. No banking, task syncing or RSVP operations are implied. */
export function ProductPreview({
  slug,
  large = false,
}: {
  slug: ProductSlug;
  large?: boolean;
}) {
  return (
    <div
      className={`${styles.preview} ${styles[slug]} ${large ? styles.largePreview : ""}`}
      aria-label={`${slug} product interface preview with sample data`}
    >
      {slug === "pocketline" ? (
        <div className={styles.previewBody}>
          <div className={styles.previewEyebrow}>YOUR MONEY / THIS MONTH</div>
          <div className={styles.previewFigure}>
            ₦184,500<span>safe to spend</span>
          </div>
          <div className={styles.financeBars}>
            <div>
              <span>Essentials</span>
              <i style={{ width: "76%" }} />
            </div>
            <div>
              <span>Savings</span>
              <i style={{ width: "55%" }} />
            </div>
            <div>
              <span>Flexible</span>
              <i style={{ width: "33%" }} />
            </div>
          </div>
          <div className={styles.previewTiles}>
            <div>
              <small>INCOME</small>
              <strong>₦450,000</strong>
            </div>
            <div>
              <small>SPENT</small>
              <strong>₦165,500</strong>
            </div>
          </div>
        </div>
      ) : slug === "tackboard" ? (
        <div className={styles.tackPreviewBody}>
          <div className={styles.tackBrand}><span className={styles.tackMark}>▤</span> tackboard<span>.</span> <small>MY BOARD / TODAY</small></div>
          <div className={styles.tackBoardLabel}>Make room for <em>doing.</em></div>
          <div className={styles.tackNotes}>
            <div className={styles.tackYellow}><small>IN PROGRESS</small><strong>Launch the website</strong><span>☑ Define the design</span><span>□ Build the homepage</span><span>□ Test and publish</span><i>1 / 3 completed</i></div>
            <div className={styles.tackGreen}><small>PLANNED</small><strong>Little reminders</strong><span>□ Write three ideas</span><span>□ Pick one to build</span><i>Make it happen ↗</i></div>
          </div>
          <div className={styles.tackPreviewFoot}>✳ &nbsp; SMALL STEPS ADD UP</div>
        </div>
      ) : (
        <div className={styles.previewBody}>
          <div className={styles.previewEyebrow}>YOU&apos;RE INVITED</div>
          <div className={styles.eventArt}>
            <span>
              GOOD
              <br />
              COMPANY.
            </span>
            <small>SAT · 24 OCT / 5:00 PM</small>
          </div>
          <div className={styles.eventBottom}>
            <span>
              Sunday Social
              <br />
              <small>Good food, good people.</small>
            </span>
            <b>RSVP ↗</b>
          </div>
          <div className={styles.eventPeople}>
            <span>38 going</span>
            <span>12 awaiting reply</span>
          </div>
        </div>
      )}
    </div>
  );
}

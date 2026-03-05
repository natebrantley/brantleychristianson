'use client';

/**
 * RMLS Internet Display Policy compliance: IDX/VOW disclaimer.
 * Must appear on property listing pages per RMLS requirements.
 * Brokerage name is configurable for white-label use.
 */

import { assetPaths } from '@/config/theme';

const DEFAULT_BROKERAGE_NAME = 'Brantley Christianson Real Estate';

export interface RMLSDisclaimerProps {
  /** Brokerage name for the disclaimer; defaults to Brantley Christianson Real Estate */
  brokerageName?: string;
  /** Optional additional class for layout */
  className?: string;
}

export function RMLSDisclaimer({ brokerageName = DEFAULT_BROKERAGE_NAME, className = '' }: RMLSDisclaimerProps) {
  return (
    <aside
      className={`rmls-disclaimer ${className}`.trim()}
      role="contentinfo"
      aria-label="RMLS listing disclaimer"
    >
      <div className="rmls-disclaimer__inner">
        <div className="rmls-disclaimer__logo-wrap" aria-hidden>
          <img
            src={`${assetPaths.logos}/rmls-logo.png`}
            alt=""
            width={80}
            height={32}
            className="rmls-disclaimer__logo"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = 'inline';
            }}
          />
          <span className="rmls-disclaimer__logo-fallback" style={{ display: 'none' }} aria-hidden>
            RMLS
          </span>
        </div>
        <p className="rmls-disclaimer__text">
          © {new Date().getFullYear()} Regional Multiple Listing Service LLC. All rights reserved. The data
          relating to real estate for sale on this web site comes in part from the IDX program of the RMLS. Real
          estate listings held by brokerage firms other than {brokerageName} are marked with the RMLS logo, and
          detailed information about these properties includes the names of the listing brokers. Listing content
          is deemed reliable but not guaranteed.
        </p>
      </div>
    </aside>
  );
}

import { Helmet } from "react-helmet-async";
import PropTypes from "prop-types";

const SEOHead = ({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  structuredData,
}) => {
  const defaultTitle = "IAMPYOQA - โยคะออนไลน์ คลาสโยคะ";
  const defaultDescription =
    "เรียนโยคะออนไลน์กับ IAMPYOQA คลาสโยคะหลากหลายระดับ จองคอร์สง่าย ๆ พร้อมครูผู้สอนมืออาชีพ";
  const defaultImage = "https://your-domain.com/default-og-image.jpg";
  const siteUrl = "https://your-domain.com";

  const fullTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta
        property="og:description"
        content={description || defaultDescription}
      />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={image || defaultImage} />

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta
        name="twitter:description"
        content={description || defaultDescription}
      />
      <meta name="twitter:image" content={image || defaultImage} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

SEOHead.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  image: PropTypes.string,
  url: PropTypes.string,
  type: PropTypes.string,
  structuredData: PropTypes.object,
};

export default SEOHead;

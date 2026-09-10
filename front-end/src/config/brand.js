export const brand = Object.freeze({
  name: "IKED YOGA",
  siteUrl: "https://iampyoqa.com",
  logoPath: "/brand/iked-yoga-logo.jpg",
  socialImagePath: "/brand/iked-yoga-social.jpg",
  address:
    "77 ม.8 ตำบลสำโรงใต้ อำเภอพระประแดง จังหวัดสมุทรปราการ 10130",
  email: "ikedyoga@gmail.com",
  phoneDisplay: "064-598-1555",
  phoneHref: "+66645981555",
  lineId: "@ikedyoga",
  lineUrl: "https://line.me/R/ti/p/@ikedyoga",
});

export const absoluteBrandAsset = (path) => `${brand.siteUrl}${path}`;

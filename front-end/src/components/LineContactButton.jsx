import { MessageCircle } from "lucide-react";
import { brand } from "../config/brand.js";
import "./LineContactButton.css";

const LineContactButton = () => (
  <a
    className="line-contact-button"
    href={brand.lineUrl}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`ติดต่อผ่านไลน์ ${brand.lineId}`}
  >
    <MessageCircle aria-hidden="true" size={22} strokeWidth={2.5} />
    <span>ติดต่อผ่านไลน์</span>
  </a>
);

export default LineContactButton;

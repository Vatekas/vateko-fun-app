// Settings modal (Liner layout). Every control saves to settings.json through main and applies live.
(() => {
const $ = id => document.getElementById(id);
const esc = t => String(t).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
let S = null;
let lang = localStorage.lang === 'en' ? 'en' : 'lt';
const L = (lt, en) => (lang === 'en' ? en : lt);

// nav + button icons: Solar 'Bold' set, the same ones Liner uses (N = nonzero, E = evenodd)
const P = {
  folder: ['NM9.52 3a2 2 0 0 1 1.442.614l.12.137L12.48 5.5H19a2 2 0 0 1 1.995 1.85L21 7.5v1.53a2 2 0 0 1 1.61 2.398l-.038.147-2.4 8a2 2 0 0 1-1.752 1.418l-.164.007H4a2 2 0 0 1-1.995-1.85L2 19V5a2 2 0 0 1 1.85-1.995L4 3zm11.136 8H6.744l-2.4 8h13.912zM9.519 5H4v8.187l.828-2.762A2 2 0 0 1 6.744 9H19V7.5h-6.52a2 2 0 0 1-1.561-.75z'],
  checkc: ['EM22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM16.0303 8.96967C16.3232 9.26256 16.3232 9.73744 16.0303 10.0303L11.0303 15.0303C10.7374 15.3232 10.2626 15.3232 9.96967 15.0303L7.96967 13.0303C7.67678 12.7374 7.67678 12.2626 7.96967 11.9697C8.26256 11.6768 8.73744 11.6768 9.03033 11.9697L10.5 13.4393L12.7348 11.2045L14.9697 8.96967C15.2626 8.67678 15.7374 8.67678 16.0303 8.96967Z'],
  tick: ['NM21.192 5.465a1 1 0 0 1 0 1.414L9.95 18.122a1.1 1.1 0 0 1-1.556 0l-5.586-5.586a1 1 0 1 1 1.415-1.415l4.95 4.95L19.777 5.465a1 1 0 0 1 1.414 0Z'],
  trash: ["NM2.75 6.16667C2.75 5.70644 3.09538 5.33335 3.52143 5.33335L6.18567 5.3329C6.71502 5.31841 7.18202 4.95482 7.36214 4.41691C7.36688 4.40277 7.37232 4.38532 7.39185 4.32203L7.50665 3.94993C7.5769 3.72179 7.6381 3.52303 7.72375 3.34536C8.06209 2.64349 8.68808 2.1561 9.41147 2.03132C9.59457 1.99973 9.78848 1.99987 10.0111 2.00002H13.4891C13.7117 1.99987 13.9056 1.99973 14.0887 2.03132C14.8121 2.1561 15.4381 2.64349 15.7764 3.34536C15.8621 3.52303 15.9233 3.72179 15.9935 3.94993L16.1083 4.32203C16.1279 4.38532 16.1333 4.40277 16.138 4.41691C16.3182 4.95482 16.8778 5.31886 17.4071 5.33335H19.9786C20.4046 5.33335 20.75 5.70644 20.75 6.16667C20.75 6.62691 20.4046 7 19.9786 7H3.52143C3.09538 7 2.75 6.62691 2.75 6.16667Z", "NM11.6068 21.9998H12.3937C15.1012 21.9998 16.4549 21.9998 17.3351 21.1366C18.2153 20.2734 18.3054 18.8575 18.4855 16.0256L18.745 11.945C18.8427 10.4085 18.8916 9.6402 18.45 9.15335C18.0084 8.6665 17.2628 8.6665 15.7714 8.6665H8.22905C6.73771 8.6665 5.99204 8.6665 5.55047 9.15335C5.10891 9.6402 5.15777 10.4085 5.25549 11.945L5.515 16.0256C5.6951 18.8575 5.78515 20.2734 6.66534 21.1366C7.54553 21.9998 8.89927 21.9998 11.6068 21.9998Z"],
  reset: ["NM12.0789 2.25C7.2854 2.25 3.34478 5.913 2.96055 10.5833H2.00002C1.69614 10.5833 1.42229 10.7667 1.30655 11.0477C1.19081 11.3287 1.25606 11.6517 1.47178 11.8657L3.15159 13.5324C3.444 13.8225 3.91567 13.8225 4.20808 13.5324L5.88789 11.8657C6.10361 11.6517 6.16886 11.3287 6.05312 11.0477C5.93738 10.7667 5.66353 10.5833 5.35965 10.5833H4.4668C4.84652 6.75167 8.10479 3.75 12.0789 3.75C14.8484 3.75 17.2727 5.20845 18.6156 7.39279C18.8325 7.74565 19.2944 7.85585 19.6473 7.63892C20.0002 7.42199 20.1104 6.96007 19.8934 6.60721C18.2871 3.99427 15.3873 2.25 12.0789 2.25Z", "NM20.8411 10.4666C20.549 10.1778 20.0789 10.1778 19.7867 10.4666L18.1005 12.1333C17.8841 12.3471 17.8184 12.6703 17.9339 12.9517C18.0495 13.233 18.3235 13.4167 18.6277 13.4167H19.5268C19.1455 17.2462 15.8759 20.25 11.8828 20.25C9.10026 20.25 6.66586 18.7903 5.31796 16.6061C5.10042 16.2536 4.63833 16.1442 4.28583 16.3618C3.93334 16.5793 3.82393 17.0414 4.04146 17.3939C5.65407 20.007 8.56406 21.75 11.8828 21.75C16.6906 21.75 20.6475 18.0892 21.0331 13.4167H22.0002C22.3043 13.4167 22.5783 13.233 22.6939 12.9517C22.8095 12.6703 22.7437 12.3471 22.5274 12.1333L20.8411 10.4666Z"],
  upload: ["NM20 15a1 1 0 0 1 1 1v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a1 1 0 1 1 2 0v4h14v-4a1 1 0 0 1 1-1M12.884 3.474 16.95 7.54a1 1 0 1 1-1.414 1.414L13 6.42V16a1 1 0 1 1-2 0V6.419L8.464 8.954A1 1 0 0 1 7.05 7.54l4.066-4.066a1.25 1.25 0 0 1 1.768 0"],
  copy: ["NM19 2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2zm-4 6H5v12h10zm-5 7a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2zm9-11H9v2h6a2 2 0 0 1 2 2v8h2zm-7 7a1 1 0 0 1 .117 1.993L12 13H8a1 1 0 0 1-.117-1.993L8 11z"],

  play: ["NM21.4086 9.35258C23.5305 10.5065 23.5305 13.4935 21.4086 14.6474L8.59662 21.6145C6.53435 22.736 4 21.2763 4 18.9671L4 5.0329C4 2.72368 6.53435 1.26402 8.59661 2.38548L21.4086 9.35258Z"],
  overlay: ["NM13 15.4C13 13.3258 13 12.2887 13.659 11.6444C14.318 11 15.3787 11 17.5 11C19.6213 11 20.682 11 21.341 11.6444C22 12.2887 22 13.3258 22 15.4V17.6C22 19.6742 22 20.7113 21.341 21.3556C20.682 22 19.6213 22 17.5 22C15.3787 22 14.318 22 13.659 21.3556C13 20.7113 13 19.6742 13 17.6V15.4Z", "NM2 8.6C2 10.6742 2 11.7113 2.65901 12.3556C3.31802 13 4.37868 13 6.5 13C8.62132 13 9.68198 13 10.341 12.3556C11 11.7113 11 10.6742 11 8.6V6.4C11 4.32582 11 3.28873 10.341 2.64437C9.68198 2 8.62132 2 6.5 2C4.37868 2 3.31802 2 2.65901 2.64437C2 3.28873 2 4.32582 2 6.4V8.6Z", "NM13 5.5C13 4.4128 13 3.8692 13.1713 3.44041C13.3996 2.86867 13.8376 2.41443 14.389 2.17761C14.8024 2 15.3266 2 16.375 2H18.625C19.6734 2 20.1976 2 20.611 2.17761C21.1624 2.41443 21.6004 2.86867 21.8287 3.44041C22 3.8692 22 4.4128 22 5.5C22 6.5872 22 7.1308 21.8287 7.55959C21.6004 8.13133 21.1624 8.58557 20.611 8.82239C20.1976 9 19.6734 9 18.625 9H16.375C15.3266 9 14.8024 9 14.389 8.82239C13.8376 8.58557 13.3996 8.13133 13.1713 7.55959C13 7.1308 13 6.5872 13 5.5Z", "NM2 18.5C2 19.5872 2 20.1308 2.17127 20.5596C2.39963 21.1313 2.83765 21.5856 3.38896 21.8224C3.80245 22 4.32663 22 5.375 22H7.625C8.67337 22 9.19755 22 9.61104 21.8224C10.1624 21.5856 10.6004 21.1313 10.8287 20.5596C11 20.1308 11 19.5872 11 18.5C11 17.4128 11 16.8692 10.8287 16.4404C10.6004 15.8687 10.1624 15.4144 9.61104 15.1776C9.19755 15 8.67337 15 7.625 15H5.375C4.32663 15 3.80245 15 3.38896 15.1776C2.83765 15.4144 2.39963 15.8687 2.17127 16.4404C2 16.8692 2 17.4128 2 18.5Z"],
  audio: ["NM2 12.124C2 6.53269 6.47713 2 11.9999 2C17.5228 2 21.9999 6.53269 21.9999 12.124L21.9999 17.3675C22.0002 18.1844 22.0004 18.7446 21.8568 19.2364C21.576 20.1982 20.9046 20.9937 20.01 21.4245C19.5525 21.6449 19.0059 21.732 18.2088 21.8591L18.0789 21.8799C17.7954 21.9252 17.5532 21.9639 17.3522 21.9839C17.1431 22.0047 16.9299 22.0111 16.7118 21.9676C15.9942 21.8245 15.4024 21.3126 15.1508 20.6172C15.0744 20.4059 15.0474 20.1916 15.035 19.9793C15.0232 19.7753 15.0232 19.527 15.0232 19.2365L15.0231 15.0641C15.0226 14.6386 15.0222 14.2725 15.1195 13.959C15.3422 13.2416 15.9238 12.6975 16.6477 12.5292C16.9641 12.4556 17.3246 12.4849 17.7435 12.5189L17.8367 12.5264L17.9465 12.5352C18.7302 12.5975 19.2664 12.6402 19.7216 12.8106C20.0415 12.9304 20.3381 13.0953 20.6046 13.2976V12.124C20.6046 7.31288 16.7521 3.41266 11.9999 3.41266C7.24776 3.41266 3.39534 7.31288 3.39534 12.124V13.2976C3.66176 13.0953 3.95843 12.9304 4.27829 12.8106C4.73345 12.6402 5.26965 12.5975 6.05335 12.5352L6.16318 12.5264L6.25641 12.5189C6.67534 12.4849 7.03581 12.4556 7.35224 12.5292C8.07612 12.6975 8.65766 13.2416 8.88039 13.959C8.97774 14.2725 8.9773 14.6386 8.97678 15.0641L8.97671 19.2365C8.97671 19.527 8.97672 19.7753 8.96487 19.9793C8.95254 20.1916 8.9255 20.4059 8.84906 20.6172C8.59754 21.3126 8.00574 21.8245 7.28812 21.9676C7.07001 22.0111 6.85675 22.0047 6.64768 21.9839C6.44671 21.9639 6.20449 21.9252 5.92102 21.8799L5.79106 21.8591C4.99399 21.732 4.44737 21.6449 3.98991 21.4245C3.09534 20.9937 2.42388 20.1982 2.14308 19.2364C2.02467 18.8309 2.00404 18.3788 2.0006 17.7747L2 17.5803V12.124Z"],
  appearance: ["EM10 6V18C10 19.4001 10 20.1002 9.72752 20.635C9.48783 21.1054 9.10538 21.4878 8.63498 21.7275C8.1002 22 7.40013 22 6 22C4.59987 22 3.8998 22 3.36502 21.7275C2.89462 21.4878 2.51217 21.1054 2.27248 20.635C2 20.1002 2 19.4001 2 18V6C2 4.59987 2 3.8998 2.27248 3.36502C2.51217 2.89462 2.89462 2.51217 3.36502 2.27248C3.8998 2 4.59987 2 6 2C7.40013 2 8.1002 2 8.63498 2.27248C9.10538 2.51217 9.48783 2.89462 9.72752 3.36502C10 3.8998 10 4.59987 10 6ZM7 19.75C7.41421 19.75 7.75 19.4142 7.75 19C7.75 18.5858 7.41421 18.25 7 18.25H5C4.58579 18.25 4.25 18.5858 4.25 19C4.25 19.4142 4.58579 19.75 5 19.75H7Z", "NM19.0599 10.6144L13.2219 16.704C12.492 17.4653 12.1271 17.8459 11.8135 17.7199C11.5 17.5939 11.5 17.0666 11.5 16.0119L11.5 7.7738C11.5012 7.11381 11.7633 6.48107 12.2291 6.01357L13.2839 4.95882L13.7141 4.62987C14.7183 3.86212 15.2204 3.47825 15.7673 3.3603C16.2175 3.26322 16.6857 3.29236 17.1204 3.4445C17.6484 3.62934 18.099 4.0725 19.0003 4.95883C19.9999 5.95839 20.4997 6.45818 20.685 7.03056C20.843 7.51871 20.847 8.04366 20.6964 8.53417C20.5199 9.10931 20.0332 9.61101 19.0599 10.6144Z", "NM12.7897 22H17.8994C19.2995 22 19.9996 22 20.5344 21.7275C21.0048 21.4878 21.3872 21.1054 21.6269 20.635C21.8994 20.1002 21.8994 19.4001 21.8994 18C21.8994 16.5999 21.8994 15.8998 21.6269 15.365C21.3872 14.8946 21.0048 14.5122 20.5344 14.2725C19.9996 14 19.2995 14 17.8994 14H17.6797L11.878 19.798C11.636 20.0399 11.5 20.3391 11.5 20.6813C11.5 21.3936 12.0774 22 12.7897 22Z"],
  custom: ["NM18 8C18 9.10457 17.1046 10 16 10C14.8954 10 14 9.10457 14 8C14 6.89543 14.8954 6 16 6C17.1046 6 18 6.89543 18 8Z", "EM11.9426 1.25H12.0574C14.3658 1.24999 16.1748 1.24998 17.5863 1.43975C19.031 1.63399 20.1711 2.03933 21.0659 2.93414C21.9607 3.82895 22.366 4.96897 22.5603 6.41371C22.75 7.82519 22.75 9.63423 22.75 11.9426V12.0309C22.75 13.9397 22.75 15.5023 22.6463 16.7745C22.5422 18.0531 22.3287 19.1214 21.8509 20.0087C21.6401 20.4001 21.3812 20.7506 21.0659 21.0659C20.1711 21.9607 19.031 22.366 17.5863 22.5603C16.1748 22.75 14.3658 22.75 12.0574 22.75H11.9426C9.63423 22.75 7.82519 22.75 6.41371 22.5603C4.96897 22.366 3.82895 21.9607 2.93414 21.0659C2.14086 20.2726 1.7312 19.2852 1.51335 18.0604C1.29935 16.8573 1.2602 15.3603 1.25207 13.5015C1.25 13.0287 1.25 12.5286 1.25 12.001V11.9426C1.24999 9.63424 1.24998 7.82519 1.43975 6.41371C1.63399 4.96897 2.03933 3.82895 2.93414 2.93414C3.82895 2.03933 4.96897 1.63399 6.41371 1.43975C7.82519 1.24998 9.63424 1.24999 11.9426 1.25ZM6.61358 2.92637C5.33517 3.09825 4.56445 3.42514 3.9948 3.9948C3.42514 4.56445 3.09825 5.33517 2.92637 6.61358C2.75159 7.91356 2.75 9.62178 2.75 12C2.75 12.2905 2.75 12.5715 2.75034 12.8435L3.75148 11.9675C4.66275 11.1702 6.03617 11.2159 6.89238 12.0721L11.1821 16.3618C11.8693 17.0491 12.9511 17.1428 13.7463 16.5839L14.0445 16.3744C15.1887 15.5702 16.7368 15.6634 17.7764 16.599L20.6068 19.1463C20.8917 18.548 21.0609 17.7618 21.1513 16.6527C21.2494 15.4482 21.25 13.9459 21.25 12C21.25 9.62178 21.2484 7.91356 21.0736 6.61358C20.9018 5.33517 20.5749 4.56445 20.0052 3.9948C19.4355 3.42514 18.6648 3.09825 17.3864 2.92637C16.0864 2.75159 14.3782 2.75 12 2.75C9.62178 2.75 7.91356 2.75159 6.61358 2.92637Z"],
  cache: ["NM20 18C20 20.2091 16.4183 22 12 22C7.58172 22 4 20.2091 4 18V13.974C4.50221 14.5906 5.21495 15.1029 6.00774 15.4992C7.58004 16.2854 9.69967 16.75 12 16.75C14.3003 16.75 16.42 16.2854 17.9923 15.4992C18.7851 15.1029 19.4978 14.5906 20 13.974V18Z", "NM12 10.75C14.3003 10.75 16.42 10.2854 17.9923 9.49925C18.7851 9.10285 19.4978 8.59059 20 7.97397V12C20 12.5 18.2143 13.5911 17.3214 14.1576C15.9983 14.8192 14.118 15.25 12 15.25C9.88205 15.25 8.00168 14.8192 6.67856 14.1576C5.5 13.5683 4 12.5 4 12V7.97397C4.50221 8.59059 5.21495 9.10285 6.00774 9.49925C7.58004 10.2854 9.69967 10.75 12 10.75Z", "NM17.3214 8.15761C15.9983 8.81917 14.118 9.25 12 9.25C9.88205 9.25 8.00168 8.81917 6.67856 8.15761C6.16384 7.95596 5.00637 7.31492 4.2015 6.27935C4.06454 6.10313 4.00576 5.87853 4.03988 5.65798C4.06283 5.50969 4.0948 5.35695 4.13578 5.26226C4.82815 3.40554 8.0858 2 12 2C15.9142 2 19.1718 3.40554 19.8642 5.26226C19.9052 5.35695 19.9372 5.50969 19.9601 5.65798C19.9942 5.87853 19.9355 6.10313 19.7985 6.27935C18.9936 7.31492 17.8362 7.95596 17.3214 8.15761Z"],
  // Solar 'User' bold
  profile: ['M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10M12 13.5c-4.42 0-8 2.24-8 5 0 1.38 1.12 2.5 2.5 2.5h11c1.38 0 2.5-1.12 2.5-2.5 0-2.76-3.58-5-8-5'],
  about: ["EM22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM12 17.75C12.4142 17.75 12.75 17.4142 12.75 17V11C12.75 10.5858 12.4142 10.25 12 10.25C11.5858 10.25 11.25 10.5858 11.25 11V17C11.25 17.4142 11.5858 17.75 12 17.75ZM12 7C12.5523 7 13 7.44772 13 8C13 8.55228 12.5523 9 12 9C11.4477 9 11 8.55228 11 8C11 7.44772 11.4477 7 12 7Z"],
  docs: ["EM4.72718 2.71244C5.03258 2.41324 5.46135 2.21816 6.27103 2.11151C7.10452 2.00172 8.2092 2 9.7931 2H14.2069C15.7908 2 16.8955 2.00172 17.729 2.11151C18.5387 2.21816 18.9674 2.41324 19.2728 2.71244C19.5782 3.01165 19.7773 3.43172 19.8862 4.22499C19.9982 5.04159 20 6.12387 20 7.67568V15.5135L7.34563 15.5135C6.44305 15.5132 5.82716 15.513 5.29899 15.6517C4.82674 15.7756 4.38867 15.9781 4 16.2442V7.67568C4 6.12387 4.00176 5.04159 4.11382 4.225C4.22268 3.43172 4.42179 3.01165 4.72718 2.71244ZM7.58621 5.78378C7.12914 5.78378 6.75862 6.1468 6.75862 6.59459C6.75862 7.04239 7.12914 7.40541 7.58621 7.40541H16.4138C16.8709 7.40541 17.2414 7.04239 17.2414 6.59459C17.2414 6.1468 16.8709 5.78378 16.4138 5.78378H7.58621ZM6.75862 10.3784C6.75862 9.93058 7.12914 9.56757 7.58621 9.56757H13.1034C13.5605 9.56757 13.931 9.93058 13.931 10.3784C13.931 10.8262 13.5605 11.1892 13.1034 11.1892H7.58621C7.12914 11.1892 6.75862 10.8262 6.75862 10.3784Z", "NM7.47341 17.1351C6.39395 17.1351 6.01657 17.1421 5.72738 17.218C4.93365 17.4264 4.30088 18.0044 4.02952 18.7558C4.0463 19.1382 4.07259 19.4746 4.11382 19.775C4.22268 20.5683 4.42179 20.9884 4.72718 21.2876C5.03258 21.5868 5.46135 21.7818 6.27103 21.8885C7.10452 21.9983 8.2092 22 9.7931 22H14.2069C15.7908 22 16.8955 21.9983 17.729 21.8885C18.5387 21.7818 18.9674 21.5868 19.2728 21.2876C19.4894 21.0753 19.6526 20.8023 19.768 20.3784H7.58621C7.12914 20.3784 6.75862 20.0154 6.75862 19.5676C6.75862 19.1198 7.12914 18.7568 7.58621 18.7568H19.9704C19.9909 18.2908 19.9972 17.7564 19.9991 17.1351H7.47341Z"],
  support: ["EM22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM12 7.75C11.3787 7.75 10.875 8.25368 10.875 8.875C10.875 9.28921 10.5392 9.625 10.125 9.625C9.71079 9.625 9.375 9.28921 9.375 8.875C9.375 7.42525 10.5503 6.25 12 6.25C13.4497 6.25 14.625 7.42525 14.625 8.875C14.625 9.58584 14.3415 10.232 13.883 10.704C13.7907 10.7989 13.7027 10.8869 13.6187 10.9708C13.4029 11.1864 13.2138 11.3753 13.0479 11.5885C12.8289 11.8699 12.75 12.0768 12.75 12.25V13C12.75 13.4142 12.4142 13.75 12 13.75C11.5858 13.75 11.25 13.4142 11.25 13V12.25C11.25 11.5948 11.555 11.0644 11.8642 10.6672C12.0929 10.3733 12.3804 10.0863 12.6138 9.85346C12.6842 9.78321 12.7496 9.71789 12.807 9.65877C13.0046 9.45543 13.125 9.18004 13.125 8.875C13.125 8.25368 12.6213 7.75 12 7.75ZM12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z"],
  tiktok: 'M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z',
  web: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.9a15.7 15.7 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.4 1.1-2.8 1.9-4zM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4zm.8 2h3a15.7 15.7 0 0 0 1.3 3.6A8 8 0 0 1 5.1 16zM8 8H5.1a8 8 0 0 1 4.3-3.6C8.8 5.5 8.4 6.7 8 8zm4 12c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.4-1.1 2.8-1.9 4zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4zm.3 5.6c.6-1.1 1-2.3 1.4-3.6h2.9a8 8 0 0 1-4.3 3.6zm1.7-5.6a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4z',
};
const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${[].concat(P[name]).map(d => d[0] === 'N' ? `<path d="${d.slice(1)}"/>` : `<path fill-rule="evenodd" d="${d[0] === 'E' ? d.slice(1) : d}"/>`).join('')}</svg>`;

// ---- branding: accent presets for OUR logo (5 equalizer bars) ----
const BRANDS = {
  default: ['var(--logo)'], spotify: ['#1ed760'], discord: ['#8b93ff', '#5865f2'], telegram: ['#37bbfe', '#007dbb'],
  aurora: ['#22d3ee', '#a78bfa', '#f472b6'], sunset: ['#fbbf24', '#f97316', '#e11d48'], ocean: ['#38bdf8', '#1d4ed8'],
  forest: ['#4ade80', '#166534'], berry: ['#f0abfc', '#a21caf', '#6d28d9'], carbon: ['#d4d4d4', '#404040'],
  pixel: ['#f43f5e', '#facc15', '#22c55e', '#3b82f6'], scanlines: ['var(--logo)', '#a3a3a3'], chrome: ['#ffffff', '#9ca3af', '#f3f4f6', '#6b7280', '#e5e7eb'],
};
let logoId = 0;
function logo(b) {
  const id = `lg${logoId++}`;
  const c = BRANDS[b] ?? BRANDS.default;
  const stop = (o, col) => `<stop offset="${o}" style="stop-color:${col}"/>`;
  // pixel: hard colour steps and square bars
  const stops = b === 'pixel' ? c.flatMap((col, i) => [stop(i / c.length, col), stop((i + 1) / c.length, col)]) : c.map((col, i) => stop(c.length > 1 ? i / (c.length - 1) : 0, col));
  const rx = b === 'pixel' ? 0 : 2;
  const scan = b === 'scanlines' ? `<pattern id="${id}p" width="32" height="2" patternUnits="userSpaceOnUse"><rect width="32" height="1.1" fill="#fff"/></pattern><mask id="${id}m"><rect width="32" height="32" fill="url(#${id}p)"/></mask>` : '';
  const bars = [[2, 3], [8, 7], [14, 11], [20, 7], [26, 3]].map(([x, y]) => `<rect x="${x}" y="${y}" width="4" height="18" rx="${rx}"/>`).join('');
  return `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${b === 'chrome' ? 10 : 32}" y2="${b === 'pixel' ? 0 : 32}">${stops.join('')}</linearGradient>${scan}</defs><g fill="url(#${id})"${scan ? ` mask="url(#${id}m)"` : ''}${b === 'pixel' ? ' shape-rendering="crispEdges"' : ''}>${bars}</g>`;
}

const GROUPS = () => [
  [L('Nuostatos', 'Preferences'), [['playback', L('Grojimas', 'Playback'), 'play'], ['overlay', L('Perdanga', 'Overlay'), 'overlay'], ['audio', L('Garsas', 'Audio'), 'audio'], ['appearance', L('Išvaizda', 'Appearance'), 'appearance'], ['custom', L('Pritaikymas', 'Customization'), 'custom'], ['profile', L('Profilis', 'Profile'), 'profile']]],
  [L('Programa', 'Application'), [['cache', L('Talpykla ir saugykla', 'Cache & Storage'), 'cache'], ['about', L('Apie', 'About'), 'about']]],
  [L('Pagalba', 'Help'), [['docs', L('Dokumentacija', 'Docs'), 'docs'], ['support', L('Pagalba', 'Support'), 'support']], 'help'],
];

// ---- controls ----
const get = k => k.split('.').reduce((o, p) => o[p], S);
const row = (title, desc, control = '', cls = '') => `<div class="row ${cls}"><div class="rt"><b>${title}</b>${desc ? `<small>${desc}</small>` : ''}</div>${control}</div>`;
const sw = (k, label) => `<button class="switch" role="switch" aria-checked="${get(k)}" aria-label="${esc(label)}" data-k="${k}"></button>`;
const seg = (k, opts, label) => `<div class="seg" role="group" aria-label="${esc(label)}">${opts.map(([v, l]) => `<button aria-pressed="${get(k) === v}" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
const pct = (v, min, max) => `${Math.max(0, Math.min(100, (v - min) / (max - min) * 100))}%`;
const range = (k, min, max, unit, label) => { const v = Math.max(min, Math.min(max, get(k))); return `<label class="rng"><input type="range" min="${min}" max="${max}" value="${v}" data-k="${k}" aria-label="${esc(label)}" style="--p:${pct(v, min, max)}"><output>${v}${unit}</output></label>`; };
// status icons (Discord-style): online dot, away moon, do-not-disturb bar, invisible ring
const ST_IC = {
  online: '<svg class="st-ic" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="#12b76a"/></svg>',
  away: '<svg class="st-ic" viewBox="0 0 16 16" aria-hidden="true"><path fill="#f59e0b" d="M8.15 2A6 6 0 1 1 2 8.15 4.4 4.4 0 0 0 8.15 2Z"/></svg>', // circle minus an upper-left bite
  dnd: '<svg class="st-ic" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="#ef4444"/><rect x="4.5" y="7" width="7" height="2" rx="1" fill="#fff"/></svg>',
  off: '<svg class="st-ic" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="4.6" fill="none" stroke="#80848e" stroke-width="2.8"/></svg>',
};
const STATUS = () => [['online', L('Prisijungęs', 'Online')], ['away', L('Pasitraukęs', 'Away')], ['dnd', L('Netrukdyti', 'Do not disturb')], ['off', L('Nematomas', 'Invisible')]];
const CHECK = '<svg class="ck" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5L4.5 9L10 3"/></svg>';
const CHEV = '<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5"/></svg>';
const FLAG = {
  lt: '<svg class="flag" viewBox="0 0 18 12" aria-hidden="true"><path fill="#FDB913" d="M0 0h18v4H0z"/><path fill="#006A44" d="M0 4h18v4H0z"/><path fill="#C1272D" d="M0 8h18v4H0z"/></svg>',
  en: '<svg class="flag" viewBox="0 0 60 30" aria-hidden="true"><clipPath id="gbs"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath><path fill="#012169" d="M0 0h60v30H0z"/><path stroke="#fff" stroke-width="6" d="M0 0l60 30m0-30L0 30"/><path stroke="#C8102E" stroke-width="4" clip-path="url(#gbs)" d="M0 0l60 30m0-30L0 30"/><path stroke="#fff" stroke-width="10" d="M30 0v30M0 15h60"/><path stroke="#C8102E" stroke-width="6" d="M30 0v30M0 15h60"/></svg>',
};
let openDd = null; // key of the open dropdown
const dd = (k, opts, label, align = '') => {
  const cur = opts.find(([v]) => v === get(k)) ?? opts[0];
  const open = openDd === k;
  return `<div class="dd ${align}"><button class="dd-btn" data-act="dd" data-v="${k}" aria-haspopup="listbox" aria-expanded="${open}" aria-label="${esc(label)}"><span>${cur[1]}</span>${CHEV}</button>` +
    (open ? `<div class="dd-menu" role="listbox">${opts.map(([v, l]) => `<button role="option" aria-selected="${v === get(k)}" data-k="${k}" data-v="${esc(v)}"><span>${l}</span>${v === get(k) ? CHECK : ''}</button>`).join('')}</div>` : '') + '</div>';
};
// theme preview: tiny window with sidebar + content, like Liner's theme cards
const mock = m => `<span class="mk mk-${m}"><span class="mk-sb"><i class="mk-dots"><b></b><b></b><b></b></i><i></i><i></i><i></i><i class="mk-pill"></i></span><span class="mk-ct"><i class="mk-ln"></i><i class="mk-bx"></i><i class="mk-bx"></i><i class="mk-bx"></i><i class="mk-bx"></i></span></span>`;
let outs = []; // audio outputs for Audio > Output Device
const loadOuts = () => navigator.mediaDevices.enumerateDevices().then(d => {
  outs = d.filter(x => x.kind === 'audiooutput' && !['default', 'communications'].includes(x.deviceId)).map((x, i) => [x.deviceId, esc(x.label || `${L('Garso įrenginys', 'Audio device')} ${i + 1}`)]);
  if (!modal.hidden && section === 'audio') drawBody();
});
navigator.mediaDevices.addEventListener('devicechange', loadOuts);
let spot = null; // Spotify account for Audio > Spotify: null while loading, 'run' while signing in
const loadSpot = () => api.spStatus().then(s => { spot = s; if (!modal.hidden && section === 'audio') drawBody(); });
const spotDesc = () => spot === 'run' ? L('Prisijunk naršyklėje…', 'Sign in in your browser…')
  : !spot ? '…'
  : spot.error ? `<em class="warn">${L('Nepavyko', 'Failed')}: ${esc(spot.error)}</em>`
  : !spot.configured ? L('Įrašyk savo Spotify app Client ID į spotify.json (žr. spotify.example.json).', 'Put your Spotify app Client ID in spotify.json (see spotify.example.json).')
  : !spot.connected ? L('Pilnos dainos per Spotify Premium. Be jo groja per YouTube.', 'Full songs through Spotify Premium. Without it songs play through YouTube.')
  : !spot.premium ? `${esc(spot.name)} · <em class="warn">${L('reikia Premium, groja per YouTube', 'Premium needed, playing through YouTube')}</em>`
  : `${esc(spot.name)} · Premium`;
const btn = (label, act, cls = '') => `<button class="btn ${cls}" data-act="${act}">${label}</button>`;
const fmtSize = b => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : b < 1073741824 ? `${(b / 1048576).toFixed(1)} MB` : `${(b / 1073741824).toFixed(2)} GB`;

let section = 'playback';
let blk = 'sidebar'; // block shown in Customization
let cache = null; // last cache:info
const picked = new Set(['covers', 'audio', 'lyrics', 'catalog']);
let report = null; // last offline report
let update = null; // last update check result
let recording = false;
let msg = {}; // per-section status line
const PLAIN = { op: 100, blur: 0, dim: 0 }; // Liner DEFAULT_BLOCK_CONFIG
const GLASS = { op: 60, blur: 20, dim: 15 }; // Liner DEFAULT_GLASS_CONFIG
const LIMITS = [250, 1024, 2048, 3072, 5120, 10240, 0]; // MB, same steps as Liner
const LIMIT_LABELS = () => ['250 MB', '1 GB', '2 GB', '3 GB', '5 GB', '10 GB', L('Be ribos', 'No limit')];
let cacheView = 'main'; // main | clearing | cleared (Liner's clear flow)
let clearPct = 0;
// ring(): donut segment between radii r1..r2 from angle a to b (degrees, 0 = top), as Liner's describeDonutSegment
const polar = (r, a) => [100 + r * Math.cos((a - 90) * Math.PI / 180), 100 + r * Math.sin((a - 90) * Math.PI / 180)];
function ring(r1, r2, a, b) {
  const end = b - a >= 360 ? a + 359.99 : b, big = end - a > 180 ? 1 : 0;
  const [x1, y1] = polar(r2, a), [x2, y2] = polar(r2, end), [x3, y3] = polar(r1, end), [x4, y4] = polar(r1, a);
  return `M ${x1} ${y1} A ${r2} ${r2} 0 ${big} 1 ${x2} ${y2} L ${x3} ${y3} A ${r1} ${r1} 0 ${big} 0 ${x4} ${y4} Z`;
}
const CATS = () => [['covers', L('Viršeliai', 'Cover Artwork'), '#06B6D4'], ['audio', L('Garso įrašai', 'Audio Tracks'), '#8B5CF6'], ['lyrics', L('Dainų žodžiai', 'Lyrics'), '#EC4899'], ['catalog', L('Katalogas ir paieška', 'Catalog & Search'), '#F59E0B']];

const SECTIONS = {
  playback: () => [L('Eilės elgsena, paspaudimų veiksmai ir garso išvestis.', 'Queue behavior, click actions and audio output.'),
    row(L('Groti panašias dainas', 'Autoplay similar tracks'), L('Automatiškai pridėti panašių dainų, kai eilė baigiasi.', 'Automatically add similar songs when your queue ends.'), sw('autoplay', 'autoplay')) +
    row(L('Dvigubas paspaudimas ant dainos', 'Double-click on track'), L('Ką daryti dukart paspaudus dainos kortelę.', 'Choose what happens when you double-click a song card.'), seg('dblclick', [['play', L('Groti iškart', 'Play instantly')], ['queue', L('Į eilę', 'Add to queue')]], 'dblclick')) +
    row(L('Numatytoji eilė', 'Default playback context'), L('Paleidus atkurti paskutinę eilę arba pradėti tuščią.', 'Restore your last queue on startup or start empty.'), seg('context', [['resume', L('Atkurti eilę', 'Resume last queue')], ['empty', L('Pradėti tuščią', 'Start empty')]], 'context')) +
    row(L('Pauzė pakeitus įrenginį', 'Pause on device change'), L('Automatiškai sustabdyti grojimą, kai pasikeičia garso išvesties įrenginys.', 'Automatically pause playback when the audio output device changes.'), sw('devicePause', 'devicePause')) +
    (info?.discord ? row(L('Discord būsena', 'Discord status'), L('Discord rodo „Klausosi Vateko.fun“ su daina, atlikėju ir laiku.', 'Discord shows "Listening to Vateko.fun" with the song, artist and time.'), sw('discord', 'discord')) : '')],

  overlay: () => [L('Perdangos elgsena, visuotinis spartusis klavišas ir vieta.', 'Desktop overlay behavior, global shortcut and position settings.'),
    row(L('Įjungti perdangą', 'Enable overlay'), L('Rodyti mažą grotuvą virš kitų langų.', 'Show a floating miniature player above other windows.'), sw('overlay', 'overlay')) +
    row(L('Vieta', 'Position'), L('Kur perdanga rodoma darbalaukyje.', 'Choose where the overlay appears on your desktop.'), seg('overlayPos', [['tl', L('Viršus kairė', 'Top Left')], ['tm', L('Viršus vidurys', 'Top Middle')], ['tr', L('Viršus dešinė', 'Top Right')]], 'position')) +
    row(L('Visuotinis spartusis klavišas', 'Global shortcut'), `${L('Perjungti perdangą iš bet kurios programos.', 'Toggle the desktop overlay from any application across the system.')}${msg.overlay ? `<br><em class="warn">${msg.overlay}</em>` : ''}`,
      `<div class="btns"><button class="btn kbd${recording ? ' rec' : ''}" data-act="rec">${recording ? L('Spausk derinį…', 'Press key combination...') : esc(S.shortcut.split('+').join(' + '))}</button></div>`) +
    row(L('Rodyti sumažinus', 'Auto-show on minimize'), L('Automatiškai rodyti perdangą, kai Vateko.fun sumažinama.', 'Automatically show the overlay when Vateko.fun is minimized.'), sw('overlayAutoMin', 'auto-show')) +
    row(L('Visada viršuje', 'Always on top'), L('Perdanga lieka virš kitų langų.', 'Keep the overlay floating above other windows.'), sw('overlayTop', 'always on top'))],

  audio: () => [L('Numatytoji grojimo kokybė ir garso išvestis.', 'Select the default audio quality and output device.'),
    row(L('Grojimo kokybė', 'Streaming Quality'), L('Numatytoji grojimo kokybė.', 'Select the default audio quality for playback.'),
      dd('quality', [['low', L('Žema kokybė (taupo duomenis)', 'Low Quality (Data Saver)')], ['standard', L('Standartinė kokybė (MP3)', 'Standard Quality (MP3)')], ['high', L('Aukšta kokybė (FLAC / WAV)', 'High Quality (FLAC / WAV)')]], 'quality')) +
    row(L('Išvesties įrenginys', 'Output Device'), L('Ausinės arba kolonėlės, per kurias groja muzika.', 'Choose the headphones or speakers music plays through.'),
      dd('outputDevice', [['', L('Sistemos numatytasis', 'System default')], ...outs], 'output device')) +
    // no spotify.json with a Client ID: the whole Spotify block stays out of sight
    (spot && spot !== 'run' && !spot.configured ? '' : `<h4 class="s-sub">Spotify</h4>` +
    row(L('Spotify paskyra', 'Spotify account'), spotDesc(),
      spot?.connected ? btn(L('Atsijungti', 'Disconnect'), 'spLogout', 'ghost') : spot?.configured ? btn(spot === 'run' ? L('Laukiama…', 'Waiting...') : L('Prijungti', 'Connect'), 'spLogin', 'dark') : '') +
    row(L('Groti per Spotify', 'Play through Spotify'), L('Kai Premium prijungtas, pilnos dainos groja per Spotify, ne YouTube.', 'When Premium is connected, full songs play through Spotify instead of YouTube.'), sw('spotify', 'spotify'))) +
    `<h4 class="s-sub">${L('Ryšys', 'Connection')}</h4>` +
    row(L('Ryšio ataskaita', 'Offline report'), report === 'run' ? L('Tikrinama…', 'Checking…') : report ? `${report.ok} ${L('iš', 'of')} ${report.n} ${L('patikrų sėkmingos', 'checks ok')} · ${report.at}` : L('Patikros dar nepaleistos.', 'Checks have not been run yet.'),
      btn(report === 'run' ? L('Tikrinama…', 'Checking...') : L('Paleisti ir išsaugoti', 'Run checks and save'), 'report', 'dark')) +
    (report && report !== 'run' ? `<div class="report">${report.results.map(r => `<div class="chk ${r.ok ? 'ok' : 'bad'}"><i></i><span>${esc(r.name)}</span><small>${r.ms} ms · ${esc(r.detail)}</small></div>`).join('')}<div class="btns">${btn(L('Kopijuoti', 'Copy'), 'repCopy', 'ghost')}${btn(L('Išsaugoti', 'Save'), 'repSave', 'ghost')}</div></div>` : '')],

  appearance: () => [L('Kalba, tema ir logotipo spalva.', 'Language, theme and logo colour.'),
    row(L('Kalba', 'Language'), L('Sąsajos kalba.', 'Select the interface language'), dd('lang', [['lt', `${FLAG.lt}Lietuvių`], ['en', `${FLAG.en}English`]], 'language', 'right')) +
    row(L('Tema', 'Theme'), L('Bendra programos išvaizda.', 'Choose the overall appearance of the app.'), '', 'col') +
    `<div class="themes">${[['system', L('Sistemos', 'System')], ['light', L('Šviesi', 'Light')], ['dark', L('Tamsi', 'Dark')]].map(([v, l]) => `<button class="theme-card" aria-pressed="${S.theme === v}" data-k="theme" data-v="${v}"><span class="tp">${v === 'system' ? mock('light') + mock('dark') : mock(v)}${S.theme === v ? `<span class="tp-ck">${CHECK}</span>` : ''}</span><span class="tl">${l}</span></button>`).join('')}</div>` +
    row(L('Logotipas', 'Branding'), L('Logotipo akcento spalva.', 'Choose the logo accent color.'), '', 'col') +
    `<div class="brands">${Object.keys(BRANDS).map(b => `<button class="brand" aria-pressed="${S.brand === b}" data-k="brand" data-v="${b}"><svg viewBox="0 0 32 32" aria-hidden="true">${logo(b)}</svg><span>${b === 'default' ? L('Numatytasis', 'Default') : b[0].toUpperCase() + b.slice(1)}</span></button>`).join('')}</div>`],

  custom: () => {
    const b = S.blocks[blk];
    const wall = S.wall
      ? `<div class="wall-card"><div class="wall-prev"><span style="background-image:url('${esc(S.wall)}');filter:${S.wallBlur ? `blur(${S.wallBlur}px)` : 'none'}"></span>${S.wallDim ? `<i style="opacity:${S.wallDim / 100}"></i>` : ''}`
        + `<div class="wall-acts"><button class="wbtn" data-act="wall">${svg('upload')}${L('Keisti', 'Change')}</button><button class="wbtn del" data-act="unwall" title="${L('Pašalinti', 'Remove')}" aria-label="${L('Pašalinti', 'Remove')}">${svg('trash')}</button></div></div>`
        + `<div class="wall-sliders"><div><span>${L('Fono suliejimas', 'Wallpaper blur')}</span>${range('wallBlur', 0, 30, 'px', 'wallpaper blur')}</div><div><span>${L('Fono pritemdymas', 'Wallpaper dimming')}</span>${range('wallDim', 0, 80, '%', 'wallpaper dimming')}</div></div></div>`
      : `<div class="drop" data-act="wall" role="button" tabindex="0"><span class="drop-ic">${svg('custom')}</span><b>${L('Pasirink paveikslėlį arba animuotą GIF', 'Select image or animated GIF')}</b><small>${msg.custom ?? 'PNG, JPEG, GIF, WebP (' + L('iki', 'up to') + ' 30MB)'}</small></div>`;
    const glass = (k, t, d, min, max, unit) => `<div class="g-row"><div class="g-t"><b>${t}</b><small>${d}</small></div>${range(`blocks.${blk}.${k}`, min, max, unit, t)}</div>`;
    return [L('Lango fono paveikslėlis, permatomumas ir blokų suliejimas.', 'Window background wallpaper, transparency and block blur effects.'),
      row(L('Lango fonas', 'Window Wallpaper'), L('Paveikslėlis arba animuotas GIF visam langui.', 'Set a custom image or animated GIF as the full window background.'), '', 'col') +
      `<div class="block-body">${wall}</div>` +
      row(L('Blokų stiklas', 'Blocks Glassmorphism'), L('Permatomumas, suliejimas ir pritemdymas kiekvienai sričiai.', 'Adjust transparency, backdrop blur and dimming for each interface area.'), '', 'col') +
      `<div class="block-body"><div class="blk-tabs"><div class="seg">${[['sidebar', L('Šoninė juosta', 'Sidebar')], ['content', L('Turinys', 'Content View')], ['mini', L('Mini grotuvas', 'Miniplayer')]].map(([v, l]) => `<button aria-pressed="${blk === v}" data-act="blk" data-v="${v}">${l}</button>`).join('')}</div>`
        + `<div class="btns"><button class="btn sm" data-act="blkAll" title="${L('Taikyti visiems blokams', 'Apply settings to all blocks')}">${svg('copy')}${L('Visiems', 'To all')}</button><button class="btn sm" data-act="blkReset" title="${L('Atstatyti bloką', 'Reset block')}">${svg('reset')}${L('Atstatyti', 'Reset')}</button></div></div>`
        + `<div class="glass">${glass('op', L('Permatomumas', 'Opacity'), L('Fono nepermatomumas (min. 25%)', 'Background opacity level (min. 25%)'), 25, 100, '%')}${glass('blur', L('Fono suliejimas', 'Backdrop blur'), L('Matinio stiklo suliejimo stipris', 'Frosted glass blur intensity'), 10, 40, 'px')}${glass('dim', L('Pritemdymas', 'Dimming'), L('Tamsus sluoksnis geresniam skaitomumui', 'Dark overlay for enhanced readability'), 8, 85, '%')}</div></div>` +
      row(L('Atstatyti visą pritaikymą', 'Reset All Customization'), L('Grąžina numatytą išvaizdą, pašalina foną ir blokų efektus.', 'Restore default appearance, clear background image and block glass effects.'), btn(L('Atstatyti', 'Reset to defaults'), 'customReset', 'dark'))];
  },

  // Profile: display name, picture, colour and status (shown on the settings user card)
  profile: () => {
    const P = S.profile, nm = P.name || me?.name || L('Svečias', 'Guest');
    const prof = `<div class="prof"><span class="prof-av" style="${P.avatar ? `background-image:url('${esc(P.avatar)}')` : `background-color:${P.color || autoColor(me?.handle)}`}">${P.avatar ? '' : esc(nm[0].toUpperCase())}<i>${ST_IC[P.status] ?? ST_IC.online}</i></span>`
      + `<div class="prof-main"><input data-prof="name" maxlength="32" value="${esc(P.name)}" placeholder="${esc(me?.name || L('Rodomas vardas', 'Display name'))}" aria-label="${L('Rodomas vardas', 'Display name')}" spellcheck="false"><small>${me?.handle ? '@' + esc(me.handle) + ' · ' : ''}${msg.prof ?? L('Vardas ir nuotrauka matomi tik šiame kompiuteryje.', 'Name and picture show on this computer only.')}</small></div>`
      + `<div class="prof-btns"><button class="btn sm" data-act="avatar">${svg('upload')}${P.avatar ? L('Keisti', 'Change') : L('Nuotrauka', 'Picture')}</button>${P.avatar ? `<button class="btn sm" data-act="unavatar">${svg('trash')}${L('Pašalinti', 'Remove')}</button>` : ''}</div></div>`;
    const colors = ['', '#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
    return [L('Rodomas vardas, nuotrauka, spalva ir būsena.', 'Display name, picture, colour and status.'),
      row(L('Profilis', 'Profile'), L('Rodomas vardas, nuotrauka, spalva ir būsena.', 'Display name, picture, colour and status.'), '', 'col') +
      `<div class="block-body">${prof}</div>` +
      row(L('Profilio spalva', 'Profile colour'), L('Fonas be nuotraukos.', 'Background when there is no picture.'), `<div class="swatches">${colors.map(c => `<button class="swatch" data-act="pcolor" data-v="${c}" aria-pressed="${P.color === c}" aria-label="${c || L('Numatyta', 'Default')}" style="background:${c || autoColor(me?.handle)}"></button>`).join('')}</div>`) +
      row(L('Būsena', 'Status'), L('Taškelis prie profilio nuotraukos.', 'The dot next to your picture.'), `<div class="seg" role="group" aria-label="${L('Būsena', 'Status')}">${STATUS().map(([v, l]) => `<button aria-pressed="${P.status === v}" data-act="pstatus" data-v="${v}">${ST_IC[v]}${l}</button>`).join('')}</div>`)];
  },

  cache: () => {
    const desc = L('Saugyklos naudojimas, talpyklos analizė ir medijos failai.', 'Storage breakdown, local cache analytics and media files.');
    if (cacheView === 'clearing') return [desc, `<div class="st-state"><span class="st-broom">${svg('trash')}</span><h3>${L('Valoma talpykla…', 'Clearing cache...')}</h3><p>${L('Neuždaryk lango, kol Vateko.fun valo talpyklą.', 'Please keep this window open while Vateko.fun is cleaning your cache.')}</p><div class="st-bar"><i style="width:${clearPct}%"></i></div><code>${clearPct}%</code></div>`];
    if (cacheView === 'cleared') return [desc, `<div class="st-state"><span class="st-ok">${svg('checkc')}</span><h3 class="big">${L('Saugykla išvalyta', 'Storage Cleared')}</h3><p class="wide">${L('Talpykla išvalyta. Naujos dainos bus siunčiamos ir kaupiamos automatiškai.', 'Your cache has been swept clean. New media will stream and cache automatically.')}</p><button class="btn st-done" data-act="cacheDone">${L('Gerai', 'Done')}</button></div>`];
    const cats = CATS();
    const total = cache ? cats.reduce((n, [k]) => n + cache[k], 0) : 0;
    const sel = cache ? cats.filter(([k]) => picked.has(k)).reduce((n, [k]) => n + cache[k], 0) : 0;
    // selected categories as donut slices with small gaps
    const on = cache ? cats.filter(([k]) => picked.has(k) && cache[k] > 0) : [];
    let at = 0;
    const slices = on.length === 1 ? [[on[0][0], on[0][2], 0, 359.99]] : on.map(([k, , col]) => { const span = cache[k] / sel * 360, gap = Math.min(2, span * .35), a = at + gap / 2, b = Math.max(a + .8, at + span - gap / 2); at += span; return [k, col, a, b]; });
    const [val, unit] = sel > 0 ? fmtSize(sel).split(' ') : ['0', ''];
    const li = LIMITS.indexOf(S.cacheLimit), g = li < 0 ? 3 : li, k = g / (LIMITS.length - 1) * 100;
    return [desc, `<div class="st">` +
      `<div class="st-panel st-top"><div class="st-cats">${cats.map(([id, l, col]) => { const b = cache?.[id] ?? 0, p = Math.round(b / (total || 1) * 100); return `<button class="st-cat${picked.has(id) ? ' on' : ''}" data-act="cat" data-v="${id}"><span class="st-l"><i class="st-box">${picked.has(id) ? svg('tick') : ''}</i><i class="st-dot" style="background:${col}"></i><b>${l}</b><em>${!b ? '0%' : p === 0 ? '<1%' : p + '%'}</em></span><small>${cache ? fmtSize(b) : '…'}</small></button>`; }).join('')}</div>` +
      `<div class="st-usage"><div class="st-ring"><svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="70"/>${slices.map(([id, col, a, b]) => `<path data-seg="${id}" d="${ring(58, 82, a, b)}" data-hot="${ring(57.5, 83.5, a, b)}" fill="${col}"/>`).join('')}</svg><div class="st-val"><b>${val}</b>${unit ? `<small>${unit}</small>` : ''}</div></div><span>${L('Saugyklos naudojimas', 'Storage Usage')}</span></div></div>` +
      `<div class="st-panel st-limit"><div class="st-lh"><h5>${L('Talpyklos dydžio riba', 'Cache size limit')}</h5><p>${L('Seniausi failai ir medija šalinami automatiškai, kai vieta baigiasi', 'Older files and media are automatically removed when full')}</p></div>` +
      `<div class="st-scale"><div class="st-track" style="--k:${k}%"><i class="st-line"></i><i class="st-fill"></i>${LIMITS.map((_, i) => `<i class="st-tick${i <= g ? ' on' : ''}" style="left:${i / (LIMITS.length - 1) * 100}%"></i>`).join('')}<i class="st-knob"></i><input type="range" min="0" max="${LIMITS.length - 1}" step="1" value="${g}" data-act="limit" aria-label="${L('Talpyklos dydžio riba', 'Cache size limit')}"></div>` +
      `<div class="st-labels">${LIMIT_LABELS().map((l, i) => `<span class="${i === g ? 'on' : ''}" data-act="limitTo" data-v="${i}" style="left:${i / (LIMITS.length - 1) * 100}%">${l}</span>`).join('')}</div></div></div>` +
      `<div class="st-acts"><button class="btn st-clear" data-act="clear"${sel > 0 && cache ? '' : ' disabled'}>${sel > 0 ? `${L('Išvalyti talpyklą', 'Clear Cache')} (${fmtSize(sel)})` : L('Išvalyti pažymėtą', 'Clear Selected Cache')}</button><button class="btn st-open" data-act="openCache">${svg('folder')}<span>${L('Atidaryti talpyklos aplanką', 'Open Cache Folder')}</span></button></div></div>`];
  },

  about: () => [L('Programos informacija.', 'Application information.'),
    `<div class="about"><svg class="about-logo" viewBox="0 0 32 32" aria-hidden="true">${logo(S.brand)}</svg><div><b>Vateko.fun</b><small>${L('Versija', 'Version')} ${esc(info?.version ?? '')}</small></div></div>`
    + `<p class="about-txt">${L('Vateko.fun – muzikos grotuvas, kurį kuriu pats. Pilnos dainos, žodžiai realiu laiku, dienos miksai ir tavo biblioteka vienoje vietoje. Sek naujienas TikTok arba apsilankyk svetainėje.', 'Vateko.fun is a music player I build myself: full songs, real-time lyrics, daily mixes and your library in one place. Follow the news on TikTok or visit the website.')}</p>`
    + `<div class="pills"><button class="pill" data-act="link" data-v="site">${svg('web')}${L('Svetainė', 'Website')}</button><button class="pill" data-act="link" data-v="tiktok">${svg('tiktok')}TikTok</button></div>` +
    row(L('Atnaujinimai', 'Updates'), update === 'run' ? L('Tikrinama…', 'Checking…') : !update ? L('Patikrink, ar yra naujesnė versija.', 'Check whether a newer version exists.')
      : update.error ? `<em class="warn">${L('Nepavyko pasiekti vateko.fun. Patikrink internetą ir bandyk vėliau.', "Couldn't reach vateko.fun. Check your connection and try again later.")}</em>`
      : update.newer ? `${L('Yra nauja versija', 'New version available')}: ${esc(update.latest)}` : `${L('Naudoji naujausią versiją', 'You are up to date')} (${esc(update.current)})`,
      `<div class="btns">${update?.newer && update.url ? btn(L('Atnaujinti', 'Update'), 'download') : ''}${btn(L('Ieškoti atnaujinimų', 'Check for updates'), 'update')}</div>`) +
    row(L('Atnaujinimo fonas', 'Update background'), L('Atnaujinant programa už „Atnaujinama“ lango išblurinama. Išjungus fonas būna tamsus.', 'While updating, the app is blurred behind the Updating screen. Off: a plain dark background.'), sw('updBlur', L('Blur', 'Blur'))) +
    ''],
};
let info = null;

// ---- apply settings to this window ----
function apply() {
  const r = document.documentElement.style;
  const blocks = { sidebar: 'sb', content: 'ct' };
  for (const [k, p] of Object.entries(blocks)) {
    const b = S.blocks[k];
    r.setProperty(`--${p}-op`, Math.max(b.op, 25) / 100);
    r.setProperty(`--${p}-blur`, `${b.blur}px`);
    r.setProperty(`--${p}-dim`, b.dim / 100);
  }
  r.setProperty('--wall', S.wall ? `url("${S.wall}")` : 'none');
  r.setProperty('--wall-blur', `${S.wallBlur}px`);
  r.setProperty('--wall-dim', S.wallDim / 100);
  document.body.classList.toggle('has-wall', !!S.wall);
  document.querySelectorAll('.bar .logo').forEach(l => { l.innerHTML = logo(S.brand); });
  if (S.lang !== lang) {
    lang = localStorage.lang = S.lang; // login screen reads the same key
    document.documentElement.lang = lang;
    translateShell();
    if (!modal.hidden) { drawNav(); drawBody(); }
  }
}
function translateShell() {
  const labels = { Pradžia: 'Home', Paieška: 'Search', Biblioteka: 'Library', Nustatymai: 'Settings' };
  document.querySelectorAll('.bar .nav').forEach(n => {
    n.dataset.lt ??= n.getAttribute('aria-label');
    n.setAttribute('aria-label', lang === 'en' ? labels[n.dataset.lt] : n.dataset.lt);
  });
  $('set-q').placeholder = L('Ieškoti nustatymų…', 'Search settings...');
  $('logout').title = L('Atsijungti', 'Sign out');
}

async function put(patch) {
  S = await api.setSettings(patch);
  apply();
}

// ---- drawing ----
const modal = $('settings');
const q = $('set-q');
const gearBtn = document.getElementById('gear');
const text = id => { const d = document.createElement('div'); d.innerHTML = SECTIONS[id]?.().join(' ') ?? ''; return d.textContent.toLowerCase(); };

function drawNav() {
  const f = q.value.trim().toLowerCase();
  const html = GROUPS().map(([title, items, cls]) => {
    const shown = items.filter(([id, label]) => !f || label.toLowerCase().includes(f) || text(id).includes(f));
    return shown.length ? `<div class="s-group ${cls ?? ''}"><h4>${title}</h4>${shown.map(([id, label, icon]) =>
      `<button class="s-item" data-sec="${id}"${id === section ? ' aria-current="page"' : ''}>${svg(icon)}${label}</button>`).join('')}</div>` : '';
  }).join('');
  $('set-nav').innerHTML = html || `<p class="s-empty">${L('Nieko nerasta.', 'Nothing found.')}</p>`;
}

function drawBody() {
  const label = GROUPS().flatMap(g => g[1]).find(i => i[0] === section)[1];
  const [desc, body] = SECTIONS[section]();
  $('set-title').textContent = label;
  $('set-desc').textContent = desc;
  const scroll = $('set-body').parentElement.scrollTop;
  $('set-body').innerHTML = body;
  $('set-body').parentElement.scrollTop = scroll;
}

async function refreshCache() {
  cache = await api.cacheInfo();
  if (section === 'cache' && !modal.hidden) drawBody();
}

let me = null;
// no colour picked: one from the @handle, the same formula the website uses, so every account looks different
const AUTO = ['#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
const autoColor = h => AUTO[[...String(h || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % AUTO.length];
// the sidebar user card: Customization > Profile over the account's own name
function drawUser() {
  const P = S.profile, name = P.name || me?.name || L('Svečias', 'Guest'), av = $('u-av');
  $('u-name').textContent = name;
  $('u-handle').textContent = me?.handle ? '@' + me.handle : '';
  $('u-init').textContent = name[0].toUpperCase();
  av.classList.toggle('img', !!P.avatar);
  av.style.backgroundImage = P.avatar ? `url('${P.avatar}')` : '';
  av.style.backgroundColor = P.avatar ? '' : P.color || autoColor(me?.handle);
  $('u-dot').innerHTML = ST_IC[P.status] ?? ST_IC.online; // the status icon itself sits on the picture
}
// profile card menu: pick a status, or jump to Customization > Profile
function uMenu(on) {
  const m = $('u-menu');
  m.hidden = !on;
  document.querySelector('.u-card').setAttribute('aria-expanded', String(on));
  if (on) m.innerHTML = STATUS().map(([v, l]) => `<button role="menuitem" data-act="pstatus" data-v="${v}">${ST_IC[v]}${l}${S.profile.status === v ? CHECK : ''}</button>`).join('')
    + `<hr><button role="menuitem" data-act="uedit">${svg('custom')}${L('Redaguoti profilį', 'Edit profile')}</button>`;
}
const prof = patch => put({ profile: { ...S.profile, ...patch } }).then(drawUser);
async function openSettings() {
  me = (await window.api?.me?.().catch(() => null)) ?? null; // modal opens even if the profile lookup fails
  drawUser();
  info ??= await api.info();
  q.value = '';
  drawNav();
  drawBody();
  modal.hidden = false;
  gearBtn.setAttribute('aria-expanded', 'true');
  q.focus();
  refreshCache();
  loadSpot();
}
const closeSettings = () => { modal.hidden = true; recording = false; gearBtn.setAttribute('aria-expanded', 'false'); gearBtn.focus(); };

const ACTS = {
  rec: () => { recording = !recording; msg.overlay = ''; drawBody(); },
  dd: el => { openDd = openDd === el.dataset.v ? null : el.dataset.v; drawBody(); },
  report: async () => {
    report = 'run';
    drawBody();
    const t = Date.now();
    const { results, report: txt } = await api.netChecks();
    report = { results, txt, ok: results.filter(r => r.ok).length, n: results.length, ms: Date.now() - t, at: new Date().toLocaleTimeString() };
    drawBody();
  },
  spLogin: async () => {
    if (spot === 'run') return;
    spot = 'run';
    drawBody();
    spot = await api.spLogin();
    if (spot.connected && spot.premium) SP.init();
    drawBody();
  },
  spLogout: async () => { spot = await api.spLogout(); SP.pause(); drawBody(); },
  repCopy: () => api.copyReport(report.txt),
  repSave: () => api.saveReport(report.txt),
  wall: async (el, file) => {
    const r = file ? await api.dropWall(file) : await api.pickWall();
    if (!r) return;
    msg.custom = r.error === 'size' ? L('Failas turi būti mažesnis nei 30 MB', 'File size must be under 30 MB') : r.error ? L('Pasirink paveikslėlį arba GIF', 'Please select an image or GIF file') : null;
    if (r.url) {
      const plain = Object.values(S.blocks).every(x => x.op === 100 && x.blur === 0);
      // first wallpaper: blocks turn to glass; glass only works on the dark theme (Liner forces it)
      await put({ wall: r.url, ...(!S.wall && plain ? { blocks: { sidebar: { ...GLASS }, content: { ...GLASS }, mini: { ...GLASS } } } : {}), ...(S.theme === 'light' ? { theme: 'dark' } : {}) });
    }
    drawBody();
  },
  avatar: async () => {
    const r = await api.pickAvatar();
    if (!r) return;
    msg.prof = r.error === 'size' ? L('Failas turi būti mažesnis nei 5 MB', 'File size must be under 5 MB') : r.error ? L('Pasirink paveikslėlį arba GIF', 'Please select an image or GIF file') : null;
    if (r.url) await prof({ avatar: r.url });
    drawBody();
  },
  unavatar: () => { api.clearAvatar(); return prof({ avatar: '' }).then(drawBody); },
  pcolor: el => { api.setColor(el.dataset.v); return prof({ color: el.dataset.v }).then(drawBody); },
  pstatus: el => { uMenu(false); return prof({ status: el.dataset.v }).then(drawBody); },
  // the card opens Profile; status, picture and colour are changed only there
  umenu: () => { section = 'profile'; msg = {}; drawNav(); drawBody(); },
  uedit: () => { uMenu(false); section = 'profile'; msg = {}; drawNav(); drawBody(); },
  unwall: () => { msg.custom = null; put({ wall: '', wallBlur: 0, wallDim: 0, blocks: { sidebar: { ...PLAIN }, content: { ...PLAIN }, mini: { ...PLAIN } } }).then(drawBody); },
  blk: el => { blk = el.dataset.v; drawBody(); },
  blkAll: () => put({ blocks: { sidebar: { ...S.blocks[blk] }, content: { ...S.blocks[blk] }, mini: { ...S.blocks[blk] } } }).then(drawBody),
  blkReset: () => put({ blocks: { ...S.blocks, [blk]: { ...(S.wall ? GLASS : PLAIN) } } }).then(drawBody),
  customReset: () => put({ profile: { name: '', avatar: '', color: '', status: 'online' }, wall: '', wallBlur: 0, wallDim: 0, applyOverlay: false, blocks: { sidebar: { ...PLAIN }, content: { ...PLAIN }, mini: { ...PLAIN } } }).then(drawBody),
  clear: async () => {
    if (!picked.size) return;
    const step = async (p, ms = 0) => { clearPct = p; drawBody(); if (ms) await new Promise(r => setTimeout(r, ms)); };
    cacheView = 'clearing';
    await step(15);
    await step(40);
    await api.clearCache([...picked]);
    await step(80, 260);
    await step(100, 140);
    cache = await api.cacheInfo();
    cacheView = 'cleared';
    drawBody();
  },
  cacheDone: () => { cacheView = 'main'; drawBody(); },
  cat: el => { const k = el.dataset.v; picked.has(k) ? picked.delete(k) : picked.add(k); drawBody(); },
  limitTo: el => put({ cacheLimit: LIMITS[+el.dataset.v] }).then(refreshCache),
  openCache: () => api.openCache(),
  update: async () => { update = 'run'; drawBody(); update = await api.checkUpdate(); drawBody(); },
  download: () => { modal.hidden = true; window.startUpdate(update.url); }, // downloads and installs inside the app
  link: el => api.openLink(el.dataset.v),
};

gearBtn.addEventListener('click', openSettings);
modal.addEventListener('click', e => {
  if (!e.target.closest('.u-menu, .u-card')) uMenu(false);
  if (e.target === modal || e.target.closest('[data-close]')) return closeSettings();
  const item = e.target.closest('[data-sec]');
  if (item) {
    if (item.dataset.sec === 'docs' || item.dataset.sec === 'support') return api.openLink('site');
    section = item.dataset.sec;
    msg = {};
    drawNav();
    drawBody();
    openDd = null;
    cacheView = 'main';
    if (section === 'cache') refreshCache();
    if (section === 'audio') { loadOuts(); loadSpot(); }
    return;
  }
  // click outside an open dropdown closes it
  if (openDd && !e.target.closest('.dd')) { openDd = null; drawBody(); return; }
  const act = e.target.closest('button[data-act], .drop[data-act], .st-labels [data-act]');
  if (act) return ACTS[act.dataset.act](act);
  const ctl = e.target.closest('button[data-k]');
  if (!ctl) return;
  const k = ctl.dataset.k;
  const v = ctl.classList.contains('switch') ? !S[k] : ctl.dataset.v;
  openDd = null;
  put({ [k]: v }).then(drawBody);
});
// sliders: live while dragging, saved on release
modal.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.act === 'limit') {
    // live preview while dragging; saved on release (change)
    const g = +el.value, tr = el.closest('.st-track');
    tr.style.setProperty('--k', `${g / (LIMITS.length - 1) * 100}%`);
    tr.querySelectorAll('.st-tick').forEach((t, i) => t.classList.toggle('on', i <= g));
    tr.nextElementSibling.querySelectorAll('span').forEach((s, i) => s.classList.toggle('on', i === g));
    return;
  }
  if (el.type !== 'range' || !el.dataset.k) return;
  const [a, b, c] = el.dataset.k.split('.');
  if (c) S.blocks[b][c] = +el.value; else S[a] = +el.value;
  el.nextElementSibling.textContent = el.value + (el.nextElementSibling.textContent.match(/\D+$/)?.[0] ?? '');
  el.style.setProperty('--p', pct(+el.value, +el.min, +el.max));
  apply();
});
modal.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.cat) { el.checked ? picked.add(el.dataset.cat) : picked.delete(el.dataset.cat); drawBody(); return; }
  if (el.dataset.act === 'limit') { put({ cacheLimit: LIMITS[el.value] }).then(refreshCache); return; }
  if (el.tagName === 'SELECT') { put({ [el.dataset.k]: el.value }); return; }
  if (el.dataset.prof === 'name') { prof({ name: el.value.trim().slice(0, 32) }); return; }
  if (el.type === 'range' && el.dataset.k) put(el.dataset.k.startsWith('blocks.') ? { blocks: S.blocks } : { [el.dataset.k]: +el.value });
});
// global shortcut recorder: needs Ctrl, Alt or Shift plus a key
document.addEventListener('keydown', async e => {
  if (recording) {
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape') { recording = false; drawBody(); return; }
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
    const mods = [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift'].filter(Boolean);
    if (!mods.length) { msg.overlay = L('Derinyje turi būti Ctrl, Alt arba Shift', 'Shortcut must include Ctrl, Alt, or Shift'); drawBody(); return; }
    const key = /^Key[A-Z]$|^Digit\d$/.test(e.code) ? e.code.slice(-1) : /^F\d+$/.test(e.key) ? e.key : e.key.length === 1 ? e.key.toUpperCase() : e.key;
    const acc = [...mods, key].join('+');
    recording = false;
    if (await api.testShortcut(acc)) { msg.overlay = ''; await put({ shortcut: acc }); } else msg.overlay = `${acc}: ${L('derinys netinkamas arba užimtas', 'invalid or already taken')}`;
    drawBody();
    return;
  }
  if (e.key === 'Escape' && openDd) { openDd = null; drawBody(); return; }
  if (e.key === 'Escape' && !modal.hidden) closeSettings();
}, true);
q.addEventListener('input', drawNav);
const hot = id => modal.querySelectorAll('[data-seg]').forEach(p => { const h = p.dataset.seg === id; if (!p.dataset.cold) p.dataset.cold = p.getAttribute('d'); p.setAttribute('d', h ? p.dataset.hot : p.dataset.cold); });
modal.addEventListener('mouseover', e => { const c = e.target.closest('.st-cat, [data-seg]'); if (c) hot(c.dataset.v ?? c.dataset.seg); });
modal.addEventListener('mouseout', e => { const c = e.target.closest('.st-cat, [data-seg]'); if (c && !c.contains(e.relatedTarget)) hot(null); });
// wallpaper drop zone: drag a file onto it
modal.addEventListener('dragover', e => { const d = e.target.closest('.drop'); if (d) { e.preventDefault(); d.classList.add('over'); } });
modal.addEventListener('dragleave', e => e.target.closest('.drop')?.classList.remove('over'));
modal.addEventListener('drop', e => { const d = e.target.closest('.drop'); if (!d) return; e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) ACTS.wall(d, f); });
const showLogo = b => document.querySelectorAll('.bar .logo').forEach(l => { l.innerHTML = logo(b); });
modal.addEventListener('mouseover', e => { const b = e.target.closest('.brand'); if (b) showLogo(b.dataset.v); });
modal.addEventListener('mouseout', e => { const b = e.target.closest('.brand'); if (b && !b.contains(e.relatedTarget)) showLogo(S.brand); });
$('logout').addEventListener('click', () => window.api?.logout());
// theme "System" follows Windows; customization notice depends on it
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!modal.hidden && section === 'custom') drawBody(); });

api.onSettings(s => { S = s; apply(); });
api.settings().then(s => { S = s; lang = null; apply(); });
})();

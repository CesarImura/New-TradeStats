/**
 * Icons: IBM Carbon (@carbon/icons-react), exported under the names the
 * prototype already uses, so screens import from here instead of an icon
 * package. Sizes come from classes (size-4 …); without one an icon is 24px.
 */
import { forwardRef, type ComponentType, type SVGProps } from "react"
import {
  Add as CAdd,
  AiGenerate as CAiGenerate,
  Archive as CArchive,
  ArrowDown as CArrowDown,
  ArrowLeft as CArrowLeft,
  ArrowRight as CArrowRight,
  ArrowUp as CArrowUp,
  ArrowUpRight as CArrowUpRight,
  Badge as CBadge,
  Book as CBook,
  Building as CBuilding,
  Bullhorn as CBullhorn,
  Calendar as CCalendar,
  CalendarAdd as CCalendarAdd,
  CalendarSettings as CCalendarSettings,
  Camera as CCamera,
  CenterCircle as CCenterCircle,
  CertificateCheck as CCertificateCheck,
  ChartCandlestick as CChartCandlestick,
  ChartLine as CChartLine,
  Chat as CChat,
  ChatBot as CChatBot,
  Checkbox as CCheckbox,
  Checkmark as CCheckmark,
  CheckmarkOutline as CCheckmarkOutline,
  Chemistry as CChemistry,
  ChevronDown as CChevronDown,
  ChevronLeft as CChevronLeft,
  ChevronRight as CChevronRight,
  ChevronSort as CChevronSort,
  ChevronUp as CChevronUp,
  CircleDash as CCircleDash,
  Close as CClose,
  CloudUpload as CCloudUpload,
  Construction as CConstruction,
  Copy as CCopy,
  Dashboard as CDashboard,
  DataBase as CDataBase,
  Document as CDocument,
  DocumentDownload as CDocumentDownload,
  DocumentExport as CDocumentExport,
  Download as CDownload,
  Draggable as CDraggable,
  Earth as CEarth,
  Edit as CEdit,
  Education as CEducation,
  Email as CEmail,
  ErrorOutline as CErrorOutline,
  EventSchedule as CEventSchedule,
  Favorite as CFavorite,
  Fire as CFire,
  Flag as CFlag,
  Forum as CForum,
  Grid as CGrid,
  Hashtag as CHashtag,
  Help as CHelp,
  Hourglass as CHourglass,
  Image as CImage,
  InProgress as CInProgress,
  Information as CInformation,
  Launch as CLaunch,
  Link as CLink,
  Locked as CLocked,
  Logout as CLogout,
  MagicWand as CMagicWand,
  Maximize as CMaximize,
  Meter as CMeter,
  Microphone as CMicrophone,
  Mobile as CMobile,
  Notebook as CNotebook,
  Notification as CNotification,
  OverflowMenuHorizontal as COverflowMenuHorizontal,
  Pin as CPin,
  PlayFilledAlt as CPlayFilledAlt,
  PlayOutline as CPlayOutline,
  Purchase as CPurchase,
  Quotes as CQuotes,
  Radio as CRadio,
  RecentlyViewed as CRecentlyViewed,
  Renew as CRenew,
  Reply as CReply,
  Report as CReport,
  Reset as CReset,
  Screen as CScreen,
  Search as CSearch,
  Security as CSecurity,
  Send as CSend,
  Settings as CSettings,
  ShieldAlert as CShieldAlert,
  Shuffle as CShuffle,
  SidePanelOpen as CSidePanelOpen,
  Sigma as CSigma,
  Star as CStar,
  Subtract as CSubtract,
  Tablet as CTablet,
  Tag as CTag,
  Time as CTime,
  Tools as CTools,
  TouchInteraction as CTouchInteraction,
  TrashCan as CTrashCan,
  Trophy as CTrophy,
  Undo as CUndo,
  Unlink as CUnlink,
  Upload as CUpload,
  User as CUser,
  UserMultiple as CUserMultiple,
  Video as CVideo,
  View as CView,
  ViewOff as CViewOff,
  Wallet as CWallet,
  Warning as CWarning,
  WarningAlt as CWarningAlt,
  SettingsAdjust as CSettingsAdjust,
  ChartColumn as CChartColumn,
  Home as CHome,
  ColorPalette as CColorPalette,
  ClosedCaption as CClosedCaption,
  PauseFilled as CPauseFilled,
  RotateClockwise as CRotateClockwise,
  Phone as CPhone,
  Partnership as CPartnership,
  TextFont as CTextFont,
  Idea as CIdea,
} from "@carbon/icons-react"

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }
export type Icon = ComponentType<IconProps>
/** Kept so older imports still type-check. */
export type LucideIcon = Icon

function icon(Carbon: ComponentType<Record<string, unknown>>, name: string): Icon {
  // Carbon icons are filled shapes; a stroke width has no meaning for them.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const I = forwardRef<SVGSVGElement, IconProps>(function I({ strokeWidth, ...p }, ref) {
    return <Carbon size={24} aria-hidden={p["aria-label"] ? undefined : true} {...p} ref={ref} />
  })
  I.displayName = name
  return I
}

const i = (Carbon: unknown, name: string) => icon(Carbon as ComponentType<Record<string, unknown>>, name)

export const AlertTriangle = i(CWarning, "AlertTriangle")
export const TriangleAlert = AlertTriangle
export const TriangleAlertIcon = AlertTriangle
export const Archive = i(CArchive, "Archive")
export const ArrowDown = i(CArrowDown, "ArrowDown")
export const ArrowDownToLine = i(CDownload, "ArrowDownToLine")
export const ArrowLeft = i(CArrowLeft, "ArrowLeft")
export const ArrowRight = i(CArrowRight, "ArrowRight")
export const ArrowUp = i(CArrowUp, "ArrowUp")
export const ArrowUpRight = i(CArrowUpRight, "ArrowUpRight")
export const ArrowUpToLine = i(CUpload, "ArrowUpToLine")
export const BadgeCheck = i(CCertificateCheck, "BadgeCheck")
export const Bell = i(CNotification, "Bell")
export const BookOpen = i(CBook, "BookOpen")
export const Bot = i(CChatBot, "Bot")
export const CalendarClock = i(CEventSchedule, "CalendarClock")
export const CalendarDays = i(CCalendar, "CalendarDays")
export const CalendarPlus = i(CCalendarAdd, "CalendarPlus")
export const CalendarRange = i(CCalendar, "CalendarRange")
export const CalendarX = i(CCalendarSettings, "CalendarX")
export const Camera = i(CCamera, "Camera")
export const CandlestickChart = i(CChartCandlestick, "CandlestickChart")
export const ChartCandlestick = CandlestickChart
export const Check = i(CCheckmark, "Check")
export const CheckIcon = Check
export const ChevronDown = i(CChevronDown, "ChevronDown")
export const ChevronDownIcon = ChevronDown
export const ChevronLeft = i(CChevronLeft, "ChevronLeft")
export const ChevronLeftIcon = ChevronLeft
export const ChevronRight = i(CChevronRight, "ChevronRight")
export const ChevronRightIcon = ChevronRight
export const ChevronUpIcon = i(CChevronUp, "ChevronUp")
export const ChevronsUpDown = i(CChevronSort, "ChevronsUpDown")
export const CircleAlert = i(CWarningAlt, "CircleAlert")
export const CircleCheckIcon = i(CCheckmarkOutline, "CircleCheck")
export const CircleDashed = i(CCircleDash, "CircleDashed")
export const CircleHelp = i(CHelp, "CircleHelp")
export const Clock = i(CTime, "Clock")
export const Construction = i(CConstruction, "Construction")
export const Copy = i(CCopy, "Copy")
export const CreditCard = i(CPurchase, "CreditCard")
export const Crosshair = i(CCenterCircle, "Crosshair")
export const Crown = i(CTrophy, "Crown")
export const Database = i(CDataBase, "Database")
export const Download = i(CDownload, "Download")
export const ExternalLink = i(CLaunch, "ExternalLink")
export const Eye = i(CView, "Eye")
export const EyeOff = i(CViewOff, "EyeOff")
export const FileDown = i(CDocumentDownload, "FileDown")
export const FileSpreadsheet = i(CReport, "FileSpreadsheet")
export const FileUp = i(CDocumentExport, "FileUp")
export const Flag = i(CFlag, "Flag")
export const Flame = i(CFire, "Flame")
export const FlaskConical = i(CChemistry, "FlaskConical")
export const FolderUp = i(CCloudUpload, "FolderUp")
export const Gauge = i(CMeter, "Gauge")
export const Globe = i(CEarth, "Globe")
export const GraduationCap = i(CEducation, "GraduationCap")
export const GripVertical = i(CDraggable, "GripVertical")
export const Hash = i(CHashtag, "Hash")
export const Heart = i(CFavorite, "Heart")
export const History = i(CRecentlyViewed, "History")
export const Hourglass = i(CHourglass, "Hourglass")
export const ImagePlus = i(CImage, "ImagePlus")
export const Inbox = i(CEmail, "Inbox")
export const Info = i(CInformation, "Info")
export const InfoIcon = Info
export const Landmark = i(CBuilding, "Landmark")
export const LayoutDashboard = i(CDashboard, "LayoutDashboard")
export const LayoutGrid = i(CGrid, "LayoutGrid")
export const LineChart = i(CChartLine, "LineChart")
export const Link2 = i(CLink, "Link2")
export const Loader2 = i(CInProgress, "Loader2")
export const Loader2Icon = Loader2
export const Lock = i(CLocked, "Lock")
export const LogOut = i(CLogout, "LogOut")
export const Mail = i(CEmail, "Mail")
export const Maximize = i(CMaximize, "Maximize")
export const Maximize2 = Maximize
export const Medal = i(CBadge, "Medal")
export const Megaphone = i(CBullhorn, "Megaphone")
export const MessageCircle = i(CChat, "MessageCircle")
export const MessageSquareReply = i(CReply, "MessageSquareReply")
export const MessageSquareText = i(CChat, "MessageSquareText")
export const MessagesSquare = i(CForum, "MessagesSquare")
export const Mic = i(CMicrophone, "Mic")
export const Minus = i(CSubtract, "Minus")
export const Monitor = i(CScreen, "Monitor")
export const MoreHorizontal = i(COverflowMenuHorizontal, "MoreHorizontal")
export const MoreHorizontalIcon = MoreHorizontal
export const MousePointerClick = i(CTouchInteraction, "MousePointerClick")
export const Newspaper = i(CDocument, "Newspaper")
export const NotebookPen = i(CNotebook, "NotebookPen")
export const OctagonXIcon = i(CErrorOutline, "OctagonX")
export const PanelLeftIcon = i(CSidePanelOpen, "PanelLeft")
export const Pencil = i(CEdit, "Pencil")
export const Pin = i(CPin, "Pin")
export const PinOff = i(CUnlink, "PinOff")
export const Play = i(CPlayFilledAlt, "Play")
export const PlayCircle = i(CPlayOutline, "PlayCircle")
export const Plus = i(CAdd, "Plus")
export const Quote = i(CQuotes, "Quote")
export const Radio = i(CRadio, "Radio")
export const RefreshCw = i(CRenew, "RefreshCw")
export const RotateCcw = i(CReset, "RotateCcw")
export const Search = i(CSearch, "Search")
export const SearchIcon = Search
export const Send = i(CSend, "Send")
export const Settings = i(CSettings, "Settings")
export const Shield = i(CSecurity, "Shield")
export const ShieldAlert = i(CShieldAlert, "ShieldAlert")
export const Shuffle = i(CShuffle, "Shuffle")
export const Sigma = i(CSigma, "Sigma")
export const Smartphone = i(CMobile, "Smartphone")
export const Sparkles = i(CAiGenerate, "Sparkles")
export const Square = i(CCheckbox, "Square")
export const Star = i(CStar, "Star")
export const Tablet = i(CTablet, "Tablet")
export const Tag = i(CTag, "Tag")
export const Trash2 = i(CTrashCan, "Trash2")
export const Trophy = i(CTrophy, "Trophy")
export const Undo2 = i(CUndo, "Undo2")
export const Unplug = i(CUnlink, "Unplug")
export const Upload = i(CUpload, "Upload")
export const User = i(CUser, "User")
export const Users = i(CUserMultiple, "Users")
export const Video = i(CVideo, "Video")
export const Wallet = i(CWallet, "Wallet")
export const Wand2 = i(CMagicWand, "Wand2")
export const Wrench = i(CTools, "Wrench")
export const X = i(CClose, "X")
export const XIcon = X
export const ArchiveRestore = i(CUndo, "ArchiveRestore")
export const FileVideo = i(CVideo, "FileVideo")
export const Settings2 = i(CSettingsAdjust, "Settings2")
export const BarChart3 = i(CChartColumn, "BarChart3")
export const House = i(CHome, "House")
export const Palette = i(CColorPalette, "Palette")
export const Captions = i(CClosedCaption, "Captions")
export const Pause = i(CPauseFilled, "Pause")
export const RotateCw = i(CRotateClockwise, "RotateCw")
export const CalendarCheck = i(CCalendar, "CalendarCheck")
export const LifeBuoy = i(CHelp, "LifeBuoy")
export const Phone = i(CPhone, "Phone")
export const CircleCheck = i(CCheckmarkOutline, "CircleCheck")
export const Handshake = i(CPartnership, "Handshake")
export const Image = i(CImage, "Image")
export const Type = i(CTextFont, "Type")
export const Lightbulb = i(CIdea, "Lightbulb")

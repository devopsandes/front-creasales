import { IconBaseProps } from "react-icons"

type Props=IconBaseProps

const QuickReplies=({size=25,strokeWidth=1.5,...rest}:Props)=>{
  const sw=typeof strokeWidth==="string"?Number(strokeWidth)||1.5:strokeWidth||1.5
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
      <path d="M8 8h8"/>
      <path d="M8 12h6"/>
    </svg>
  )
}

export default QuickReplies



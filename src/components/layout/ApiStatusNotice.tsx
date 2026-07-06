type ApiStatusNoticeProps = {
  message: string
}

export function ApiStatusNotice({ message }: ApiStatusNoticeProps) {
  return (
    <div className="mt-3.5 rounded-[18px] border border-[#E8EDF5] bg-white px-4 py-3 text-[12px] font-semibold text-[#64748B] shadow-[0_14px_34px_rgba(15,23,42,0.045)]">
      {message}
    </div>
  )
}

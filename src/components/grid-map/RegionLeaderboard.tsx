import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  getRegionalLayerValue,
  getRegionalLeaderboardPresentation,
  type RegionId,
  type RegionalDemandData,
  type RegionalLayer,
} from "@/lib/regional-data"

export function RegionLeaderboard({
  regions,
  layer,
  onSelect,
}: {
  regions: RegionalDemandData[]
  layer: RegionalLayer
  onSelect: (regionId: RegionId) => void
}) {
  const sortedRegions = [...regions].sort(
    (left, right) => getRegionalLayerValue(right, layer) - getRegionalLayerValue(left, layer)
  )
  const tablePresentation = getRegionalLeaderboardPresentation(sortedRegions[0], layer)

  return (
    <Card>
      <CardHeader className="px-5 pt-5 md:px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Regional Leaderboard</p>
        <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-tight text-[#0F172A]">
          {tablePresentation.heading}
        </h2>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-y border-[#E8EDF5] bg-[#F8FAFD] text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
                <th className="px-6 py-2.5">Region</th>
                {tablePresentation.headers.map((header) => (
                  <th key={header} className="px-4 py-2.5">{header}</th>
                ))}
                <th className="px-6 py-2.5">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EDF5]">
              {sortedRegions.map((region, index) => {
                const presentation = getRegionalLeaderboardPresentation(region, layer)
                return (
                  <tr
                  key={region.id}
                  tabIndex={0}
                  onClick={() => onSelect(region.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") onSelect(region.id)
                  }}
                  className="cursor-pointer transition-colors hover:bg-[#FBFCFE] focus:bg-[#F8FAFD] focus:outline-none"
                >
                  <td className="px-6 py-3 font-semibold text-[#0F172A]">
                    <span className="mr-3 inline-block w-4 text-[10px] font-bold text-[#94A3B8]">{index + 1}</span>
                    {region.name}
                  </td>
                  {presentation.values.map((value, valueIndex) => (
                    <td key={presentation.headers[valueIndex]} className="px-4 py-3 tabular-nums font-medium text-[#64748B]">
                      {value}
                    </td>
                  ))}
                  <td className="px-6 py-3 tabular-nums font-semibold text-[#0F172A]">{region.confidence.toFixed(1)}%</td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

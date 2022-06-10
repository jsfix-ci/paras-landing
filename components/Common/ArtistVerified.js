import { IconVerified } from 'components/Icons'
import useProfileData from 'hooks/useProfileData'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import ReactTooltip from 'react-tooltip'
import { prettyTruncate } from 'utils/common'

const ArtistVerified = ({ token, collection }) => {
	const [showTooltip, setShowTooltip] = useState(false)
	const artistData = useProfileData(token?.metadata.creator_id)

	useEffect(() => {
		setShowTooltip(true)
	}, [token])

	const getCreatorId = () => {
		return token?.metadata.creator_id || token?.contract_id
	}

	return (
		<>
			{showTooltip && <ReactTooltip place="right" type="dark" />}
			<span className="font-semibold">
				<Link
					href={
						token?.metadata.creator_id
							? `/${getCreatorId()}/creation`
							: `/collection/${getCreatorId()}`
					}
				>
					<a className="text-white font-semibold border-b-2 border-transparent hover:border-white">
						{prettyTruncate(getCreatorId(), 30, 'address')}
					</a>
				</Link>
			</span>
			{(artistData?.isCreator || collection?.isCreator) && (
				<span data-tip="Verified Creator" className="ml-1">
					<IconVerified size={18} />
				</span>
			)}
		</>
	)
}

export default ArtistVerified

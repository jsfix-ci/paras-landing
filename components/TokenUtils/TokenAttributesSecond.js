import cachios from 'cachios'
import { useState, useEffect } from 'react'
import { IconArrowSmall } from 'components/Icons'
import IconEmptyAttribute from 'components/Icons/component/IconEmptyAttribute'

const TokenAttributesSecond = ({ localToken }) => {
	const [attributes, setAttributes] = useState([])
	const collection = localToken.metadata.collection_id
		? {
				id: localToken.metadata.collection_id,
				name: localToken.metadata.collection,
		  }
		: {
				id: localToken.contract_id,
				name: localToken.contract_id,
		  }

	useEffect(() => {
		if (localToken.metadata.attributes) {
			getRarity(localToken.metadata.attributes)
		}
	}, [localToken])

	const getRarity = async (attributes) => {
		const res = await cachios.post(`${process.env.V2_API_URL}/rarity`, {
			collection_id: collection.id,
			attributes: attributes,
			ttl: 120,
		})

		const newAttribute = await res.data.data
		setAttributes(newAttribute)
	}

	return (
		<div className="bg-neutral-03 text-white rounded-lg border border-neutral-05 p-4 mt-4 mb-10">
			<p className="font-bold text-xl mb-2">Attributes</p>
			<p className="font-normal text-xs">
				Some of the characteristics that determine the rarity score
			</p>
			<div className="flex flex-row justify-between items-center mt-8">
				<div className="border border-neutral-05 rounded-lg text-sm font-bold p-2">
					{' '}
					Rarity Score: {localToken.metadata?.score.toFixed(2) || 0}{' '}
				</div>
				<div>
					<button className="bg-neutral-05 rounded-lg">
						<IconArrowSmall size={30} />
					</button>
				</div>
			</div>

			<div className="max-h-80 overflow-y-auto">
				{attributes.length <= 0 ? (
					<IconEmptyAttribute size={100} className="mx-auto my-4" />
				) : (
					attributes.map((attribute) => (
						<a
							key={attribute}
							className="flex flex-row justify-between items-center bg-neutral-01 border border-neutral-05 rounded-lg px-3 py-4 my-2"
							href={`/collection/${collection.id}/?attributes=[${JSON.stringify({
								[attribute.trait_type]: attribute.value,
							})}]`}
						>
							<div>
								<p className="text-neutral-08">{attribute.trait_type} :</p>
								<p className="text-neutral-09">{attribute.value}</p>
							</div>
							<div className="text-right bg-neutral-03 rounded-lg p-1">
								<p className="text-sm text-neutral-09">
									{attribute.rarity?.rarity.toFixed(2)} % Rarity
								</p>
							</div>
						</a>
					))
				)}
			</div>
		</div>
	)
}

export default TokenAttributesSecond

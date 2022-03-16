import axios from 'axios'
import Button from 'components/Common/Button'
import Media from 'components/Common/Media'
import Modal from 'components/Common/Modal'
import { IconX } from 'components/Icons'
import getConfig from 'config/near'
import near from 'lib/near'
import useStore from 'lib/store'
import { formatNearAmount } from 'near-api-js/lib/utils/format'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import {
	FacebookIcon,
	FacebookShareButton,
	TelegramIcon,
	TelegramShareButton,
	TwitterIcon,
	TwitterShareButton,
} from 'react-share'
import { decodeBase64 } from 'utils/common'

const SuccessTransactionModal = () => {
	const [showModal, setShowModal] = useState(false)
	const [token, setToken] = useState(null)
	const [txDetail, setTxDetail] = useState(null)
	const currentUser = useStore((state) => state.currentUser)
	const router = useRouter()

	useEffect(() => {
		const checkTxStatus = async () => {
			const txStatus = await near.getTransactionStatus({
				accountId: near.currentUser.accountId,
				txHash: router.query.transactionHashes,
			})

			if (txStatus.status.SuccessValue !== undefined) {
				const { actions, receiver_id } = txStatus.transaction

				for (const action of actions) {
					const { FunctionCall } = action
					const args = JSON.parse(decodeBase64(FunctionCall.args))

					if (FunctionCall.method_name === 'nft_buy') {
						const res = await axios.get(`${process.env.V2_API_URL}/token-series`, {
							params: {
								contract_id: receiver_id,
								token_series_id: args.token_series_id,
							},
						})
						setToken(res.data.data.results[0])
						setTxDetail({ ...FunctionCall, args })
						setShowModal(true)
					} else if (FunctionCall.method_name === 'buy') {
						const res = await axios.get(`${process.env.V2_API_URL}/token`, {
							params: {
								contract_id: args.nft_contract_id,
								token_id: args.token_id,
							},
						})
						setToken(res.data.data.results[0])
						setTxDetail({ ...FunctionCall, args })
						setShowModal(true)
					} else if (FunctionCall.method_name === 'add_offer') {
						const res = await axios.get(
							`${process.env.V2_API_URL}/${args.token_id ? 'token' : 'token-series'}`,
							{
								params: {
									contract_id: args.nft_contract_id,
									token_id: args.token_id,
									token_series_id: args.token_series_id,
								},
							}
						)
						setToken(res.data.data.results[0])
						setTxDetail({ ...FunctionCall, args })
						setShowModal(true)
					} else if (FunctionCall.method_name === 'buy_mint_bundle') {
						const logs = txStatus.receipts_outcome[0].outcome.logs
						const getLogsTokenId = logs[0].split('token_ids')
						const tokenId = getLogsTokenId[(0, 1)].split('"')

						const res = await axios.get(`${process.env.V2_API_URL}/token`, {
							params: {
								contract_id: args.nft_contract_id,
								token_id: tokenId[2],
							},
						})

						setToken(res.data.data.results[0])
						setTxDetail({ ...FunctionCall, args })
						setShowModal(true)
					}
				}
			}
		}

		if (currentUser && router.query.transactionHashes) {
			checkTxStatus()
		}
	}, [currentUser, router.query.transactionHashes])

	const onCloseModal = () => {
		setShowModal(false)
		setToken(null)
		removeTxHash()
	}

	const removeTxHash = () => {
		const query = router.query
		delete query.transactionHashes
		router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
	}

	if (!showModal || !token) return null

	const tokenUrl = `${window.location.hostname}/token/${token.contract_id}::${
		token.token_series_id
	}${token.token_id ? `/${token.token_id}` : ''}`
	const explorerUrl =
		getConfig(process.env.APP_ENV || 'development').explorerUrl +
		'/transactions/' +
		router.query.transactionHashes

	const onClickSeeToken = () => {
		const url = `/token/${token.contract_id}::${token.token_series_id}${
			token.token_id ? `/${token.token_id}` : ''
		}${txDetail.method_name === 'add_offer' ? '?tab=offers' : ''}`
		router.push(url)
		onCloseModal()
	}

	return (
		<Modal isShow={showModal} close={onCloseModal} className="p-8">
			<div className="max-w-sm w-full p-4 bg-gray-800 md:m-auto rounded-md relative">
				<div className="absolute right-0 top-0 pr-4 pt-4">
					<div className="cursor-pointer" onClick={onCloseModal}>
						<IconX />
					</div>
				</div>
				<div>
					<h1 className="text-2xl font-bold text-white tracking-tight">
						{txDetail.method_name === 'add_offer'
							? 'Offer Success'
							: txDetail.method_name === 'buy_mint_bundle'
							? 'Gacha!'
							: 'Purchase Success'}
					</h1>
					<p className="text-white mt-2">
						{txDetail.method_name === 'add_offer' ? (
							<>
								You successfully offer <b>{token.metadata.title}</b> for{' '}
								{formatNearAmount(txDetail.args.price)} Ⓝ
							</>
						) : txDetail.method_name === 'buy_mint_bundle' ? (
							<>
								You successfully minted <b>{token.metadata.title}</b>
							</>
						) : (
							<>
								You successfully purchase <b>{token.metadata.title}</b>
							</>
						)}
					</p>
					<div className="p-4">
						<div className="w-2/3 m-auto h-56">
							<Media
								className="rounded-lg overflow-hidden h-full w-full"
								url={token.metadata.media}
								videoControls={true}
								videoLoop={true}
								videoMuted={true}
								videoPadding={false}
							/>
						</div>
					</div>
					<div className="p-3 bg-gray-700 rounded-md mt-2 mb-4">
						<p className="text-gray-300 text-sm">Transaction Hash</p>
						<a href={explorerUrl} target="_blank" rel="noreferrer">
							<p className="text-white hover:underline cursor-pointer overflow-hidden overflow-ellipsis">
								{router.query.transactionHashes}
							</p>
						</a>
					</div>
					<div className="flex justify-between px-1 mb-4">
						<p className="text-sm text-white">Share to:</p>
						<div className="flex gap-2">
							<FacebookShareButton url={tokenUrl} className="flex text-white">
								<FacebookIcon size={24} round />
							</FacebookShareButton>
							<TelegramShareButton url={tokenUrl} className="flex text-white">
								<TelegramIcon size={24} round />
							</TelegramShareButton>{' '}
							<TwitterShareButton
								title={`Checkout ${token.metadata.title} from collection ${token.metadata.collection} on @ParasHQ\n\n#paras #cryptoart #digitalart #tradingcards`}
								url={tokenUrl}
								className="flex text-white"
							>
								<TwitterIcon size={24} round />
							</TwitterShareButton>
						</div>
					</div>
					<div className="flex justify-between gap-4">
						<Button size="md" isFullWidth onClick={onClickSeeToken}>
							See Token
						</Button>
						{txDetail.method_name === 'buy_mint_bundle' && (
							<a
								href={`https://comic.paras.id/comics/${token.metadata.collection_id}/chapter`}
								rel="noreferrer"
								target="_blank"
							>
								<svg
									className="inline-block mt-2"
									width="28"
									height="28"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										fillRule="evenodd"
										clipRule="evenodd"
										d="M5 5V19H19V12H21V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H12V5H5ZM14 5V3H21V10H19V6.41L9.17 16.24L7.76 14.83L17.59 5H14Z"
										fill="white"
									/>
								</svg>
							</a>
						)}
					</div>
				</div>
			</div>
		</Modal>
	)
}

export default SuccessTransactionModal

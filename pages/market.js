import axios from 'axios'
import { useSpring, animated } from 'react-spring'
import { useContext, useEffect, useRef, useState } from 'react'
import Card from '../components/Card'
import Nav from '../components/Nav'
import { prettyBalance } from '../utils/common'
import Link from 'next/link'

const CardContainer = ({ tokens, fetchData }) => {
	const containerRef = useRef()
	const [animValues, setAnimValues] = useState(1)
	const [mouseDown, setMouseDown] = useState(null)
	const [touchStart, setTouchStart] = useState(null)
	const animValuesRef = useRef(animValues)

	const props = useSpring({ transform: `translate3d(${animValues}px, 0,0)` })

	useEffect(() => {
		animValuesRef.current = animValues
	}, [animValues])

	useEffect(() => {
		if (containerRef) {
			containerRef.current.addEventListener('wheel', handleScroll, {
				passive: false,
			})
		}
	}, [containerRef])

	const handleScroll = (e) => {
		e.preventDefault()

		var rawData = e.deltaY ? e.deltaY : e.deltaX
		var mouseY = Math.floor(rawData)

		var animationValue = animValuesRef.current
		var newAnimationValue = animationValue - mouseY

		animateScroll(newAnimationValue)
	}

	const animateScroll = (newAnimationValue) => {
		let max = containerRef.current.lastElementChild.scrollWidth
		let win = containerRef.current.offsetWidth

		var bounds = -(max - win)

		if (newAnimationValue > 0) {
			setAnimValues(0)
		} else if (newAnimationValue < bounds) {
			fetchData()
			setAnimValues(bounds)
		} else {
			setAnimValues(newAnimationValue)
		}
	}

	const handleMouseDown = (e) => {
		setMouseDown({
			x: e.pageX,
			y: e.pageY,
		})
	}

	const handleMouseMove = (e) => {
		if (mouseDown) {
			const diffX = mouseDown.x - e.pageX

			animateScroll(animValues - diffX)
			setMouseDown({
				x: e.pageX,
				y: e.pageY
			})
		}
	}

	const handleMouseUp = (e) => {
		setMouseDown(null)
	}

	const handleTouchStart = (e) => {
		setTouchStart({
			x: e.touches[0].pageX,
			y: e.touches[0].pageY,
		})
	}

	const handleTouchMove = (e) => {
		if (touchStart) {
			const diffX = touchStart.x - e.touches[0].pageX

			animateScroll(animValues - diffX)
			setTouchStart({
				x: e.touches[0].pageX,
				y: e.touches[0].pageY
			})
		}
	}

	const handleTouchEnd = () => {
		setTouchStart(null)
	}

	const _getLowestPrice = (ownerships) => {
		const marketDataList = ownerships
			.filter((ownership) => ownership.marketData)
			.map((ownership) => ownership.marketData.amount)
			.sort((a, b) => a - b)

		return marketDataList[0]
	}

	return (
		<div
			ref={containerRef}
			onMouseDown={handleMouseDown}
			onMouseUp={handleMouseUp}
			onMouseMove={handleMouseMove}
			onTouchStart={handleTouchStart}
			onTouchEnd={handleTouchEnd}
			onTouchMove={handleTouchMove}
			className="overflow-hidden"
		>
			<animated.div className="flex -mx-8" style={props}>
				{tokens.map((token, idx) => {
					return (
						<div key={idx} className="p-8 relative">
							<div
								className="max-w-full lg:max-w-sm m-auto"
								style={{
									width: `30vh`,
								}}
							>
								<Card
									imgUrl={token.metadata.image}
									token={{
										name: token.metadata.name,
										collection: token.metadata.collection,
										description: token.metadata.description,
										creatorId: token.creatorId,
										supply: token.supply,
										tokenId: token.tokenId,
										createdAt: token.createdAt,
									}}
									initialRotate={{
										x: 0,
										y: 0,
									}}
								/>
							</div>
							<div className="text-center p-4">
								<h4 className="text-gray-400 ">{token.metadata.collection}</h4>
								<h2 className="text-3xl text-white">{token.metadata.name}</h2>

								<p className="mt-8 text-gray-400 ">Start From</p>
								<div className="text-white text-3xl">
									{_getLowestPrice(token.ownerships) ? (
										<div>
											{prettyBalance(_getLowestPrice(token.ownerships), 24, 4)}{' '}
											Ⓝ
										</div>
									) : (
										<div className="line-through text-red-600">
											<span className="text-white">SALE</span>
										</div>
									)}
								</div>
								<Link href={`/token/${token.tokenId}`}>
								<p className="text-white mt-8 cursor-pointer">See Details</p>
								</Link>
							</div>
						</div>
					)
				})}
			</animated.div>
		</div>
	)
}

export default function MarketPage({ data }) {
	const [tokens, setTokens] = useState(data.results)
	const [page, setPage] = useState(1)
	const [isFetching, setIsFetching] = useState(false)
	const [hasMore, setHasMore] = useState(true)

	const _fetchData = async () => {
		if (isFetching && !hasMore) {
			return
		}

		setIsFetching(true)
		const res = await axios(
			`http://localhost:9090/tokens?__skip=${page * 10}&__limit=10`
		)
		const data = await res.data.data

		const newTokens = [...tokens, ...data.results]
		setIsFetching(false)
		setTokens(newTokens)
		setPage(page + 1)
		setHasMore(data.results.length === 0 ? true : false)
	}

	return (
		<div
			className="min-h-screen bg-dark-primary-1 select-none"
			style={{
				backgroundImage: `linear-gradient(to bottom, #000000 0%, rgba(0, 0, 0, 0.69) 69%, rgba(0, 0, 0, 0) 100%)`,
			}}
		>
			<Nav />
			<div className="max-w-6xl relative m-auto mt-12">
				<div className="p-4">
					<CardContainer tokens={tokens} fetchData={_fetchData} />
				</div>
			</div>
		</div>
	)
}

export async function getServerSideProps() {
	const res = await axios(`http://localhost:9090/tokens?__limit=10`)
	const data = await res.data.data

	return { props: { data } }
}

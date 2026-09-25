import { MDBBtn } from 'mdb-react-ui-kit'

export default function Photo({ image, onClose }) {
	return (
		<div
			className="position-fixed top-0 bottom-0 start-0 end-0 bg-dark d-flex align-items-center justify-content-center animation fade-in"
			style={{ zIndex: 3000 }}
			onClick={onClose}
		>
			<MDBBtn
				color="success"
				className="position-absolute top-0 end-0 m-3"
				style={{ zIndex: 1 }}
				aria-label="Tutup penampil"
				title="Tutup penampil"
				onClick={onClose}
			>
				<i className="fas fa-xmark" />
			</MDBBtn>
			<img
				src={image}
				alt="Foto marker"
				className="mw-100 mh-100"
				style={{ maxHeight: 'calc(100vh - 2rem)', objectFit: 'contain' }}
				onClick={(event) => event.stopPropagation()}
			/>
		</div>
	)
}

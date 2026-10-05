import { motion } from 'framer-motion';
export function Card({children,className='',...props}){return <motion.section initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className={`card ${className}`} {...props}>{children}</motion.section>}
export function Button({children,variant='',className='',...props}){return <button className={`button ${variant} ${className}`} {...props}>{children}</button>}
export function Field({label,...props}){return <label className="field"><span>{label}</span><input {...props}/></label>}
export function Select({label,children,...props}){return <label className="field"><span>{label}</span><select {...props}>{children}</select></label>}
export function Empty({title='Nothing here yet',children}){return <div className="empty"><span className="empty-mark">✦</span><strong>{title}</strong><p>{children}</p></div>}
export function Spinner(){return <div className="spinner-wrap"><span className="spinner"/> Loading AuraStudy…</div>}
export function ErrorLine({error}){return error?<div className="notice error">{error.message||error}</div>:null}
export function Modal({title,onClose,children}){return <div className="modal-backdrop" onClick={onClose}><section className="modal card" onClick={e=>e.stopPropagation()}><header><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close">×</button></header>{children}</section></div>}

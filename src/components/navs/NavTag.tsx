import React, { useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { NavTagProps } from '../../interfaces/common.interface';
import './navtag.css'

const NavTag: React.FC<NavTagProps> = (elements) => {

    useEffect(()=>{
        
    },[])
    
    return (
        <div className='dash-container'>
            <nav className='dash-navbar'>
                <ul className='dash-nav-listado flex justify-between pr-4' >
                    {elements.tags.map(tag => (
                        <li>
                            <Link 
                                key={tag.id}
                                to={`${tag.path}`} 
                                className='dash-link'
                            >   
                                {tag.name}
                            </Link>
                        </li>
                    ))}
                   
                     <div className="border border-black/50 rounded-lg px-3 py-1 text-gray-800/80 inline-block ml-3">
                            {new Date().toLocaleDateString('es-AR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                    </div>
                   
                </ul>
            </nav>
            <nav className='dash-navbar'>

            </nav>
            <div className='main-empresa'>
                <Outlet />
            </div>
        </div>
    );
};

export default NavTag;
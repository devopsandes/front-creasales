import React, { useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { NavTagProps, Tag } from '../../interfaces/common.interface';
import './navtag.css'

const NavTag: React.FC<NavTagProps> = (elements) => {

    useEffect(()=>{

    },[])
    
    return (
        <div className='dash-container'>
            <nav className='dash-navbar'>
                <ul className='dash-nav-listado'>
                    {elements.tags.map(tag => (
                        <li>
                            <Link 
                                key={tag.name}
                                to={`${tag.path}`} 
                                className='dash-link'
                            >   
                                {tag.name}
                            </Link>
                        </li>
                    ))}
                   
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
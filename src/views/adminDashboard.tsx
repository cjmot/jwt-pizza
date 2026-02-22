import React from 'react';
import View from './view';
import { useNavigate } from 'react-router-dom';
import NotFound from './notFound';
import Button from '../components/button';
import { pizzaService } from '../service/service';
import { Franchise, FranchiseList, Role, Store, User, UserList } from '../service/pizzaService';
import { TrashIcon } from '../icons';

interface Props {
    user: User | null;
}

export default function AdminDashboard(props: Props) {
    const navigate = useNavigate();
    const [activeList, setActiveList] = React.useState<'franchises' | 'users'>('franchises');
    const [nameFilter, setNameFilter] = React.useState('*');
    const [franchiseList, setFranchiseList] = React.useState<FranchiseList>({
        franchises: [],
        more: false,
    });
    const [userList, setUserList] = React.useState<UserList>({ users: [], more: false });
    const [listPage, setListPage] = React.useState(0);
    const filterFranchiseRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        (async () => {
            if (activeList === 'franchises') {
                setFranchiseList(await pizzaService.getFranchises(listPage, 3, nameFilter));
                return;
            }
            setUserList(await pizzaService.listUsers(listPage, 10, nameFilter));
        })();
    }, [props.user, listPage, activeList, nameFilter]);

    function createFranchise() {
        navigate('/admin-dashboard/create-franchise');
    }

    async function closeFranchise(franchise: Franchise) {
        navigate('/admin-dashboard/close-franchise', { state: { franchise: franchise } });
    }

    async function closeStore(franchise: Franchise, store: Store) {
        navigate('/admin-dashboard/close-store', { state: { franchise: franchise, store: store } });
    }

    async function filterFranchises() {
        const value = filterFranchiseRef.current?.value?.trim() || '';
        setNameFilter(value ? `*${value}*` : '*');
        setListPage(0);
    }

    function openDeleteUser(user: User) {
        navigate('/admin-dashboard/delete-user', { state: { user } });
    }

    let response = <NotFound />;
    if (Role.isRole(props.user, Role.Admin)) {
        response = (
            <View title="Mama Ricci's kitchen">
                <div className="text-start py-8 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 mb-3">
                        <button
                            className={`px-3 py-1 text-sm font-semibold rounded-lg border ${
                                activeList === 'franchises'
                                    ? 'border-orange-400 bg-orange-400 text-white'
                                    : 'border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800'
                            }`}
                            onClick={() => {
                                setActiveList('franchises');
                                setListPage(0);
                                setNameFilter('*');
                                if (filterFranchiseRef.current) {
                                    filterFranchiseRef.current.value = '';
                                }
                            }}
                        >
                            Franchises
                        </button>
                        <button
                            className={`px-3 py-1 text-sm font-semibold rounded-lg border ${
                                activeList === 'users'
                                    ? 'border-orange-400 bg-orange-400 text-white'
                                    : 'border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800'
                            }`}
                            onClick={() => {
                                setActiveList('users');
                                setListPage(0);
                                setNameFilter('*');
                                if (filterFranchiseRef.current) {
                                    filterFranchiseRef.current.value = '';
                                }
                            }}
                        >
                            Users
                        </button>
                    </div>
                    <h3 className="text-neutral-100 text-xl">
                        {activeList === 'franchises' ? 'Franchises' : 'Users'}
                    </h3>
                    <div className="bg-neutral-100 overflow-clip my-4">
                        <div className="flex flex-col">
                            <div className="-m-1.5 overflow-x-auto">
                                <div className="p-1.5 min-w-full inline-block align-middle">
                                    <div className="overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="uppercase text-neutral-100 bg-slate-400 border-b-2 border-gray-500">
                                                <tr>
                                                    {(activeList === 'franchises'
                                                        ? [
                                                              'Franchise',
                                                              'Franchisee',
                                                              'Store',
                                                              'Revenue',
                                                              'Action',
                                                          ]
                                                        : ['User', 'Email', 'Action']
                                                    ).map((header) => (
                                                        <th
                                                            key={header}
                                                            scope="col"
                                                            className="px-6 py-3 text-center text-xs font-medium"
                                                        >
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            {activeList === 'franchises' &&
                                                franchiseList.franchises.map((franchise, findex) => {
                                                    return (
                                                        <tbody
                                                            key={findex}
                                                            className="divide-y divide-gray-200"
                                                        >
                                                            <tr className="border-neutral-500 border-t-2">
                                                                <td className="text-start px-2 whitespace-nowrap text-l font-mono text-orange-600">
                                                                    {franchise.name}
                                                                </td>
                                                                <td
                                                                    className="text-start px-2 whitespace-nowrap text-sm font-normal text-gray-800"
                                                                    colSpan={3}
                                                                >
                                                                    {franchise.admins
                                                                        ?.map((o) => o.name)
                                                                        .join(', ')}
                                                                </td>
                                                                <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                                                                    <button
                                                                        type="button"
                                                                        className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400  hover:border-orange-800 hover:text-orange-800"
                                                                        onClick={() =>
                                                                            closeFranchise(franchise)
                                                                        }
                                                                    >
                                                                        <TrashIcon />
                                                                        Close
                                                                    </button>
                                                                </td>
                                                            </tr>

                                                            {franchise.stores.map(
                                                                (store, sindex) => {
                                                                    return (
                                                                        <tr
                                                                            key={sindex}
                                                                            className="bg-neutral-100"
                                                                        >
                                                                            <td
                                                                                className="text-end px-2 whitespace-nowrap text-sm text-gray-800"
                                                                                colSpan={3}
                                                                            >
                                                                                {store.name}
                                                                            </td>
                                                                            <td className="text-end px-2 whitespace-nowrap text-sm text-gray-800">
                                                                                {store.totalRevenue?.toLocaleString()}{' '}
                                                                                ₿
                                                                            </td>
                                                                            <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                                                                                <button
                                                                                    type="button"
                                                                                    className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800"
                                                                                    onClick={() =>
                                                                                        closeStore(
                                                                                            franchise,
                                                                                            store,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <TrashIcon />
                                                                                    Close
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                },
                                                            )}
                                                        </tbody>
                                                    );
                                                })}
                                            {activeList === 'users' && (
                                                <tbody className="divide-y divide-gray-200">
                                                    {userList.users.map((user, index) => (
                                                        <tr
                                                            key={`${user.id || user.email || index}`}
                                                            className="border-neutral-500 border-t-2"
                                                        >
                                                            <td className="text-start px-2 whitespace-nowrap text-l font-mono text-orange-600">
                                                                {user.name || 'Unknown user'}
                                                            </td>
                                                            <td className="text-start px-2 whitespace-nowrap text-sm font-normal text-gray-800">
                                                                {user.email || 'No email'}
                                                            </td>
                                                            <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                                                                <button
                                                                    type="button"
                                                                    className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800"
                                                                    onClick={() => openDeleteUser(user)}
                                                                >
                                                                    <TrashIcon />
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            )}
                                            <tfoot>
                                                <tr>
                                                    <td className="px-1 py-1">
                                                        <input
                                                            type="text"
                                                            ref={filterFranchiseRef}
                                                            name="filterFranchise"
                                                            placeholder={
                                                                activeList === 'franchises'
                                                                    ? 'Filter franchises'
                                                                    : 'Filter users'
                                                            }
                                                            className="px-2 py-1 text-sm border border-gray-300 rounded-lg"
                                                        />
                                                        <button
                                                            type="submit"
                                                            className="ml-2 px-2 py-1 text-sm font-semibold rounded-lg border border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800"
                                                            onClick={filterFranchises}
                                                        >
                                                            Submit
                                                        </button>
                                                    </td>
                                                    <td
                                                        colSpan={
                                                            activeList === 'franchises' ? 4 : 2
                                                        }
                                                        className="text-end text-sm font-medium"
                                                    >
                                                        <button
                                                            className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300 "
                                                            onClick={() =>
                                                                setListPage(listPage - 1)
                                                            }
                                                            disabled={listPage <= 0}
                                                        >
                                                            «
                                                        </button>
                                                        <button
                                                            className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300"
                                                            onClick={() =>
                                                                setListPage(listPage + 1)
                                                            }
                                                            disabled={
                                                                activeList === 'franchises'
                                                                    ? !franchiseList.more
                                                                    : !userList.more
                                                            }
                                                        >
                                                            »
                                                        </button>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {activeList === 'franchises' && (
                    <div>
                        <Button
                            className="w-36 text-xs sm:text-sm sm:w-64"
                            title="Add Franchise"
                            onPress={createFranchise}
                        />
                    </div>
                )}
            </View>
        );
    }

    return response;
}
